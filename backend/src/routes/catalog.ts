import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// Validation schemas
const createCatalogItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  duration_minutes: z.number().positive().optional(),
  requires_appointment: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true)
});

const updateCatalogItemSchema = createCatalogItemSchema.partial();

// GET /catalog - List products/services
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const is_active = req.query.is_active as string;
  const price_range = req.query.price_range as string;
  const requires_appointment = req.query.requires_appointment as string;
  const search = req.query.search as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('catalog_items')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (is_active && is_active !== 'all') {
      query = query.eq('is_active', is_active === 'true');
    }

    if (price_range) {
      const [minPrice, maxPrice] = price_range.split(',').map(Number);
      if (minPrice) query = query.gte('price', minPrice);
      if (maxPrice) query = query.lte('price', maxPrice);
    }

    if (requires_appointment && requires_appointment !== 'all') {
      query = query.eq('requires_appointment', requires_appointment === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: items, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: items || [],
      message: 'Catalog items retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting catalog items:', error);
    throw createError('Erro ao obter itens do catálogo', 500);
  }
}));

// POST /catalog - Create new catalog item
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const validatedData = createCatalogItemSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: item, error } = await supabase.supabase
      .from('catalog_items')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Catalog item created', { itemId: item.id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: 'Item do catálogo criado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating catalog item:', error);
    throw createError('Erro ao criar item do catálogo', 500);
  }
}));

// GET /catalog/:id - Get catalog item details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: item, error } = await supabase.supabase
      .from('catalog_items')
      .select(`
        *,
        order_items (
          id,
          quantity,
          orders (
            id,
            order_date,
            status,
            customers (id, name)
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Item do catálogo não encontrado', 404);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: 'Catalog item details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting catalog item:', error);
    throw createError('Erro ao obter item do catálogo', 500);
  }
}));

// PUT /catalog/:id - Update catalog item
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const validatedData = updateCatalogItemSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: item, error } = await supabase.supabase
      .from('catalog_items')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Item do catálogo não encontrado', 404);
      }
      throw error;
    }

    logger.info('Catalog item updated', { itemId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: 'Item do catálogo atualizado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating catalog item:', error);
    throw createError('Erro ao atualizar item do catálogo', 500);
  }
}));

// DELETE /catalog/:id - Soft delete catalog item
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Check if item has pending orders
    const { data: pendingOrders } = await supabase.supabase
      .from('order_items')
      .select(`
        orders (status)
      `)
      .eq('catalog_item_id', id)
      .in('orders.status', ['pending', 'confirmed', 'in_progress']);

    if (pendingOrders && pendingOrders.length > 0) {
      throw createError('Não é possível excluir item com pedidos pendentes', 409);
    }

    const { data: item, error } = await supabase.supabase
      .from('catalog_items')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Item do catálogo não encontrado', 404);
      }
      throw error;
    }

    logger.info('Catalog item soft deleted', { itemId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: 'Item do catálogo desativado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deleting catalog item:', error);
    throw createError('Erro ao excluir item do catálogo', 500);
  }
}));

// POST /catalog/:id/image - Upload item image
router.post('/:id/image', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;
  const { image_url } = req.body;

  if (!image_url) {
    throw createError('URL da imagem é obrigatória', 400);
  }

  try {
    const supabase = getSupabaseService();

    const { data: item, error } = await supabase.supabase
      .from('catalog_items')
      .update({
        image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Item do catálogo não encontrado', 404);
      }
      throw error;
    }

    logger.info('Catalog item image updated', { itemId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: 'Imagem do item atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating catalog item image:', error);
    throw createError('Erro ao atualizar imagem', 500);
  }
}));

// GET /catalog/categories - Get all categories
router.get('/categories/list', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase.supabase
      .from('catalog_items')
      .select('category')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;

    // Get unique categories with counts
    const categoryCounts = (data || []).reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting categories:', error);
    throw createError('Erro ao obter categorias', 500);
  }
}));

// GET /catalog/popular - Get popular items
router.get('/popular/items', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  const limit = parseInt(req.query.limit as string) || 10;
  const days = parseInt(req.query.days as string) || 30;

  try {
    const supabase = getSupabaseService();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get items ordered in the last N days with order counts
    const { data, error } = await supabase.supabase
      .from('catalog_items')
      .select(`
        *,
        order_items!inner (
          quantity,
          orders!inner (
            id,
            order_date,
            status
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .gte('order_items.orders.order_date', startDate.toISOString())
      .in('order_items.orders.status', ['confirmed', 'completed'])
      .limit(limit);

    if (error) throw error;

    // Calculate popularity scores
    const popularItems = (data || []).map((item: any) => {
      const totalQuantity = item.order_items.reduce((sum: number, oi: any) => sum + oi.quantity, 0);
      const orderCount = item.order_items.length;

      return {
        ...item,
        popularity_score: totalQuantity * 2 + orderCount,
        total_ordered: totalQuantity,
        order_count: orderCount
      };
    });

    // Sort by popularity score
    popularItems.sort((a, b) => b.popularity_score - a.popularity_score);

    const response: ApiResponse<any[]> = {
      success: true,
      data: popularItems.slice(0, limit),
      message: 'Popular items retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting popular items:', error);
    throw createError('Erro ao obter itens populares', 500);
  }
}));

// GET /catalog/recommendations/:customer_id - Get recommended items for customer
router.get('/recommendations/:customer_id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { customer_id } = req.params;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const supabase = getSupabaseService();

    // Get customer's order history
    const { data: customerOrders } = await supabase.supabase
      .from('orders')
      .select(`
        order_items (
          catalog_item_id,
          catalog_items (category, tags)
        )
      `)
      .eq('customer_id', customer_id)
      .eq('organization_id', organizationId);

    // Extract categories and tags from customer's order history
    const customerPreferences = {
      categories: new Set<string>(),
      tags: new Set<string>()
    };

    customerOrders?.forEach(order => {
      order.order_items.forEach((item: any) => {
        if (item.catalog_items.category) {
          customerPreferences.categories.add(item.catalog_items.category);
        }
        if (item.catalog_items.tags) {
          item.catalog_items.tags.forEach((tag: string) => customerPreferences.tags.add(tag));
        }
      });
    });

    // Get recommended items based on preferences
    let query = supabase.supabase
      .from('catalog_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (customerPreferences.categories.size > 0) {
      query = query.in('category', Array.from(customerPreferences.categories));
    }

    const { data: recommendations, error } = await query.limit(limit);

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: recommendations || [],
      message: 'Recommendations retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting recommendations:', error);
    throw createError('Erro ao obter recomendações', 500);
  }
}));

// GET /catalog/stats - Get catalog statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const supabase = getSupabaseService();

    // Get total items
    const { count: totalItems } = await supabase.supabase
      .from('catalog_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get active items
    const { count: activeItems } = await supabase.supabase
      .from('catalog_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get categories count
    const { data: categoryData } = await supabase.supabase
      .from('catalog_items')
      .select('category')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const uniqueCategories = new Set(categoryData?.map(item => item.category) || []).size;

    // Get average price
    const { data: priceData } = await supabase.supabase
      .from('catalog_items')
      .select('price')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const prices = priceData?.map(item => item.price) || [];
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

    // Get items requiring appointments
    const { count: appointmentItems } = await supabase.supabase
      .from('catalog_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('requires_appointment', true);

    const stats = {
      total_items: totalItems || 0,
      active_items: activeItems || 0,
      inactive_items: (totalItems || 0) - (activeItems || 0),
      categories_count: uniqueCategories,
      average_price: Math.round(averagePrice * 100) / 100,
      appointment_required_items: appointmentItems || 0,
      price_range: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Catalog statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting catalog statistics:', error);
    throw createError('Erro ao obter estatísticas do catálogo', 500);
  }
}));

export default router;