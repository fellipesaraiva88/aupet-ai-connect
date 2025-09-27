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

// GET /customers - List all customers with filtering and pagination
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const tags = req.query.tags as string;
  const status = req.query.status as string;
  const sort = req.query.sort as string || 'created_at';

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('customers')
      .select('*, pets(id, name, species)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    // Apply sorting
    const ascending = sort.startsWith('-') ? false : true;
    const sortField = sort.replace(/^-/, '');
    query = query.order(sortField, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: customers, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: customers || [],
      message: 'Customers retrieved successfully',
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
    logger.error('Error getting customers:', error);
    throw createError('Erro ao obter clientes', 500);
  }
}));

// POST /customers - Create new customer
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: customer, error } = await supabase.supabase
      .from('customers')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        status: 'active',
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';
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
  const organizationId = authReq.user?.organizationId || 'default-org';

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

export default router;