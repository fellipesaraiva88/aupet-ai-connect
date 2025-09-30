import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { orgCache } from '../middleware/cache';
import { extractPaginationParams, createPaginatedResponse, applyPaginationToQuery } from '../utils/pagination';
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
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  emergency_contact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /customers - List all customers with filtering and pagination (cached for 5 minutes)
router.get('/', orgCache(300), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  // Extract pagination parameters
  const paginationParams = extractPaginationParams(req, {
    defaultLimit: 20,
    maxLimit: 100
  });

  const tags = req.query.tags as string;
  const status = req.query.status as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('customers')
      .select('*, pets(id, name, species)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply search filter
    if (paginationParams.search) {
      query = query.or(`name.ilike.%${paginationParams.search}%,phone.ilike.%${paginationParams.search}%,email.ilike.%${paginationParams.search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply tags filter
    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    // Apply pagination and sorting
    query = applyPaginationToQuery(query, paginationParams);

    const { data: customers, error, count } = await query;

    if (error) throw error;

    // Create paginated response
    const response = createPaginatedResponse(
      customers || [],
      count || 0,
      paginationParams,
      `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`
    );

    res.json({
      success: true,
      ...response,
      message: 'Customers retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error getting customers:', error);
    throw createError('Erro ao obter clientes', 500);
  }
}));

// POST /customers - Create new customer
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: customer, error } = await supabase.supabase
      .from('customers')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Customer created', { customerId: customer.id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: customer,
      message: 'Cliente criado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating customer:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw createError('Cliente com este telefone já existe', 409);
    }
    throw createError('Erro ao criar cliente', 500);
  }
}));

// GET /customers/:id - Get specific customer details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: customer, error } = await supabase.supabase
      .from('customers')
      .select(`
        *,
        pets (*),
        appointments (
          id,
          title,
          appointment_date,
          status,
          estimated_cost
        ),
        conversations (
          id,
          status,
          last_message_at,
          messages_count:whatsapp_messages(count)
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Cliente não encontrado', 404);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: customer,
      message: 'Customer details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer:', error);
    throw createError('Erro ao obter cliente', 500);
  }
}));

// PUT /customers/:id - Update customer information
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const validatedData = updateCustomerSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: customer, error } = await supabase.supabase
      .from('customers')
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
        throw createError('Cliente não encontrado', 404);
      }
      throw error;
    }

    logger.info('Customer updated', { customerId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: customer,
      message: 'Cliente atualizado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating customer:', error);
    throw createError('Erro ao atualizar cliente', 500);
  }
}));

// DELETE /customers/:id - Soft delete customer
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Check if customer has active appointments
    const { data: activeAppointments } = await supabase.supabase
      .from('appointments')
      .select('id')
      .eq('customer_id', id)
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (activeAppointments && activeAppointments.length > 0) {
      throw createError('Não é possível excluir cliente com agendamentos ativos', 409);
    }

    const { data: customer, error } = await supabase.supabase
      .from('customers')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Cliente não encontrado', 404);
      }
      throw error;
    }

    logger.info('Customer soft deleted', { customerId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: customer,
      message: 'Cliente desativado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deleting customer:', error);
    throw createError('Erro ao excluir cliente', 500);
  }
}));

// GET /customers/:id/pets - Get all pets for a customer
router.get('/:id/pets', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: pets, error } = await supabase.supabase
      .from('pets')
      .select('*')
      .eq('customer_id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: pets || [],
      message: 'Customer pets retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer pets:', error);
    throw createError('Erro ao obter pets do cliente', 500);
  }
}));

// GET /customers/:id/appointments - Get all appointments for a customer
router.get('/:id/appointments', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: appointments, error } = await supabase.supabase
      .from('appointments')
      .select(`
        *,
        pets (id, name, species),
        staff:assigned_to (id, name)
      `)
      .eq('customer_id', id)
      .eq('organization_id', organizationId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: appointments || [],
      message: 'Customer appointments retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer appointments:', error);
    throw createError('Erro ao obter agendamentos do cliente', 500);
  }
}));

// GET /customers/:id/conversations - Get all conversations for a customer
router.get('/:id/conversations', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: conversations, error } = await supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_contacts (id, name, phone),
        whatsapp_messages (
          id,
          content,
          direction,
          message_type,
          created_at
        )
      `)
      .eq('whatsapp_contacts.customer_id', id)
      .eq('organization_id', organizationId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: conversations || [],
      message: 'Customer conversations retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer conversations:', error);
    throw createError('Erro ao obter conversas do cliente', 500);
  }
}));

// POST /customers/:id/notes - Add note to customer
router.post('/:id/notes', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    throw createError('Nota não pode estar vazia', 400);
  }

  try {
    const supabase = getSupabaseService();

    // Get current notes
    const { data: customer } = await supabase.supabase
      .from('customers')
      .select('notes')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    const currentNotes = customer?.notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note.trim()}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n\n${newNote}` : newNote;

    const { data: updatedCustomer, error } = await supabase.supabase
      .from('customers')
      .update({
        notes: updatedNotes,
        updated_at: timestamp
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Cliente não encontrado', 404);
      }
      throw error;
    }

    logger.info('Note added to customer', { customerId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: updatedCustomer,
      message: 'Nota adicionada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error adding note to customer:', error);
    throw createError('Erro ao adicionar nota', 500);
  }
}));

// GET /customers/search - Advanced customer search
router.get('/search/advanced', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const {
    query: searchQuery,
    filters = {},
    page = 1,
    limit = 20
  } = req.query;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('customers')
      .select('*, pets(id, name, species)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply search query
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // Apply filters
    const filterObj = typeof filters === 'string' ? JSON.parse(filters) : filters;
    Object.entries(filterObj).forEach(([key, value]) => {
      if (value && value !== 'all') {
        query = query.eq(key, value);
      }
    });

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data: customers, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limitNum);

    const response: PaginatedResponse<any> = {
      success: true,
      data: customers || [],
      message: 'Advanced search completed successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error in advanced customer search:', error);
    throw createError('Erro na busca avançada', 500);
  }
}));

// GET /customers/stats - Customer statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  try {
    const supabase = getSupabaseService();

    // Get basic customer counts
    const { count: totalCustomers } = await supabase.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: activeCustomers } = await supabase.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const { count: vipCustomers } = await supabase.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'vip');

    // Get new customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newThisMonth } = await supabase.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    // Get customers with pets
    const { data: customersWithPets } = await supabase.supabase
      .from('customers')
      .select(`
        id,
        pets (count)
      `)
      .eq('organization_id', organizationId);

    const customersWithoutPets = customersWithPets?.filter(c => !c.pets || c.pets.length === 0).length || 0;

    // Calculate average pets per customer
    const totalPets = customersWithPets?.reduce((sum, c) => sum + (c.pets?.length || 0), 0) || 0;
    const avgPetsPerCustomer = totalCustomers && totalCustomers > 0 ? totalPets / totalCustomers : 0;

    const stats = {
      total_customers: totalCustomers || 0,
      active_customers: activeCustomers || 0,
      vip_customers: vipCustomers || 0,
      new_this_month: newThisMonth || 0,
      customers_without_pets: customersWithoutPets,
      average_pets_per_customer: avgPetsPerCustomer,
      growth_rate: calculateGrowthRate(newThisMonth || 0, totalCustomers || 0)
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Customer statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer statistics:', error);
    throw createError('Erro ao obter estatísticas de clientes', 500);
  }
}));

// GET /customers/:id/spending - Customer spending analysis
router.get('/:id/spending', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 365;

  try {
    const supabase = getSupabaseService();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get customer appointments and spending
    const { data: appointments } = await supabase.supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        service_type,
        price,
        actual_cost,
        status,
        pets (id, name, species)
      `)
      .eq('customer_id', id)
      .eq('organization_id', organizationId)
      .gte('appointment_date', startDate.toISOString())
      .order('appointment_date', { ascending: false });

    if (!appointments) {
      throw createError('Cliente não encontrado', 404);
    }

    // Calculate spending metrics
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.actual_cost || apt.price || 0), 0);
    const avgPerVisit = completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0;

    // Monthly spending breakdown
    const monthlySpending = completedAppointments.reduce((acc, apt) => {
      const month = apt.appointment_date.substring(0, 7); // YYYY-MM
      const amount = apt.actual_cost || apt.price || 0;
      acc[month] = (acc[month] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    // Service type breakdown
    const serviceSpending = completedAppointments.reduce((acc, apt) => {
      const amount = apt.actual_cost || apt.price || 0;
      acc[apt.service_type] = (acc[apt.service_type] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    // Visit frequency
    const visitsByMonth = appointments.reduce((acc, apt) => {
      const month = apt.appointment_date.substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analysis = {
      period_days: days,
      total_spent: totalSpent,
      total_appointments: appointments.length,
      completed_appointments: completedAppointments.length,
      average_per_visit: avgPerVisit,
      monthly_spending: monthlySpending,
      service_spending: serviceSpending,
      visit_frequency: visitsByMonth,
      recent_appointments: appointments.slice(0, 10)
    };

    const response: ApiResponse<any> = {
      success: true,
      data: analysis,
      message: 'Customer spending analysis retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer spending analysis:', error);
    throw createError('Erro ao obter análise de gastos', 500);
  }
}));

// POST /customers/:id/tags - Manage customer tags
router.post('/:id/tags', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;
  const { tags, action = 'replace' } = req.body;

  const tagSchema = z.object({
    tags: z.array(z.string().min(1)).max(20, 'Máximo 20 tags'),
    action: z.enum(['add', 'remove', 'replace']).default('replace')
  });

  try {
    const { tags: validTags, action: validAction } = tagSchema.parse({ tags, action });
    const supabase = getSupabaseService();

    // Get current customer
    const { data: customer } = await supabase.supabase
      .from('customers')
      .select('tags')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!customer) {
      throw createError('Cliente não encontrado', 404);
    }

    let updatedTags: string[] = [];
    const currentTags = customer.tags || [];

    switch (validAction) {
      case 'add':
        updatedTags = [...new Set([...currentTags, ...validTags])];
        break;
      case 'remove':
        updatedTags = currentTags.filter(tag => !validTags.includes(tag));
        break;
      case 'replace':
        updatedTags = validTags;
        break;
    }

    const { data: updatedCustomer, error } = await supabase.supabase
      .from('customers')
      .update({
        tags: updatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Customer tags updated', {
      customerId: id,
      action: validAction,
      tags: validTags,
      organizationId
    });

    const response: ApiResponse<any> = {
      success: true,
      data: updatedCustomer,
      message: 'Tags atualizadas com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating customer tags:', error);
    if (error.name === 'ZodError') {
      throw createError('Tags inválidas', 400);
    }
    throw createError('Erro ao atualizar tags', 500);
  }
}));

// GET /customers/segmentation - Customer segmentation analysis
router.get('/segmentation/analysis', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  try {
    const supabase = getSupabaseService();

    // Get customers with their appointment data
    const { data: customers } = await supabase.supabase
      .from('customers')
      .select(`
        id,
        name,
        created_at,
        status,
        appointments (
          id,
          actual_cost,
          price,
          status,
          appointment_date
        )
      `)
      .eq('organization_id', organizationId);

    if (!customers) {
      throw createError('Erro ao carregar dados de clientes', 500);
    }

    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const completedAppointments = customer.appointments?.filter(apt => apt.status === 'completed') || [];
      const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.actual_cost || apt.price || 0), 0);

      const lastAppointment = completedAppointments.length > 0 ?
        Math.max(...completedAppointments.map(apt => new Date(apt.appointment_date).getTime())) : null;

      const daysSinceLastVisit = lastAppointment ?
        Math.floor((Date.now() - lastAppointment) / (1000 * 60 * 60 * 24)) : null;

      const avgSpentPerVisit = completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0;

      return {
        id: customer.id,
        name: customer.name,
        total_spent: totalSpent,
        visit_count: completedAppointments.length,
        avg_spent_per_visit: avgSpentPerVisit,
        days_since_last_visit: daysSinceLastVisit,
        customer_since_days: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    // Segment customers
    const segments = {
      champions: customerMetrics.filter(c => c.total_spent > 1000 && c.visit_count >= 5 && (c.days_since_last_visit || 999) <= 30),
      loyal_customers: customerMetrics.filter(c => c.visit_count >= 3 && (c.days_since_last_visit || 999) <= 60),
      potential_loyalists: customerMetrics.filter(c => c.total_spent > 500 && c.visit_count >= 2),
      new_customers: customerMetrics.filter(c => c.customer_since_days <= 90),
      at_risk: customerMetrics.filter(c => c.total_spent > 300 && (c.days_since_last_visit || 0) > 90),
      cant_lose_them: customerMetrics.filter(c => c.total_spent > 1000 && (c.days_since_last_visit || 0) > 60),
      hibernating: customerMetrics.filter(c => (c.days_since_last_visit || 0) > 180)
    };

    // Calculate segment statistics
    const segmentStats = Object.entries(segments).map(([name, customers]) => ({
      segment: name,
      count: customers.length,
      total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
      avg_revenue_per_customer: customers.length > 0 ?
        customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length : 0,
      percentage: (customers.length / customerMetrics.length) * 100
    }));

    const analysis = {
      total_customers: customerMetrics.length,
      segments: segmentStats,
      segment_details: segments
    };

    const response: ApiResponse<any> = {
      success: true,
      data: analysis,
      message: 'Customer segmentation analysis completed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error performing customer segmentation:', error);
    throw createError('Erro ao realizar segmentação de clientes', 500);
  }
}));

// POST /customers/bulk-action - Bulk actions on customers
router.post('/bulk-action', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const bulkActionSchema = z.object({
    customer_ids: z.array(z.string().uuid()).min(1, 'Pelo menos um cliente é obrigatório').max(100, 'Máximo 100 clientes por ação'),
    action: z.enum(['update_status', 'add_tags', 'remove_tags', 'update_field']),
    data: z.object({
      status: z.enum(['active', 'inactive', 'vip']).optional(),
      tags: z.array(z.string()).optional(),
      field: z.string().optional(),
      value: z.any().optional()
    })
  });

  try {
    const { customer_ids, action, data } = bulkActionSchema.parse(req.body);
    const supabase = getSupabaseService();

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'update_status':
        if (!data.status) throw createError('Status é obrigatório para esta ação', 400);
        updateData.status = data.status;
        break;
      case 'add_tags':
        if (!data.tags) throw createError('Tags são obrigatórias para esta ação', 400);
        // This would require a more complex query to merge tags
        throw createError('Ação de adicionar tags em lote não implementada ainda', 501);
      case 'remove_tags':
        if (!data.tags) throw createError('Tags são obrigatórias para esta ação', 400);
        // This would require a more complex query to remove specific tags
        throw createError('Ação de remover tags em lote não implementada ainda', 501);
      case 'update_field':
        if (!data.field || data.value === undefined) {
          throw createError('Campo e valor são obrigatórios para esta ação', 400);
        }
        updateData[data.field] = data.value;
        break;
    }

    // Verify all customers belong to the organization
    const { data: existingCustomers } = await supabase.supabase
      .from('customers')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', customer_ids);

    const foundIds = new Set(existingCustomers?.map(c => c.id) || []);
    const notFoundIds = customer_ids.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      throw createError(`Clientes não encontrados: ${notFoundIds.join(', ')}`, 404);
    }

    // Perform bulk update
    const { data: updatedCustomers, error } = await supabase.supabase
      .from('customers')
      .update(updateData)
      .eq('organization_id', organizationId)
      .in('id', customer_ids)
      .select();

    if (error) throw error;

    logger.info('Bulk action performed on customers', {
      action,
      customerCount: customer_ids.length,
      organizationId
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: updatedCustomers || [],
      message: `Ação em lote realizada com sucesso em ${updatedCustomers?.length || 0} clientes`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error performing bulk action on customers:', error);
    if (error.name === 'ZodError') {
      throw createError('Dados de ação em lote inválidos', 400);
    }
    throw createError('Erro ao realizar ação em lote', 500);
  }
}));

// Helper function
function calculateGrowthRate(newCustomers: number, totalCustomers: number): number {
  if (totalCustomers === 0) return 0;
  return (newCustomers / totalCustomers) * 100;
}

export default router;