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
const createPetSchema = z.object({
  customer_id: z.string().uuid('Customer ID inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().optional(),
  color: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  birth_date: z.string().optional(),
  weight: z.number().positive().optional(),
  microchip_number: z.string().optional(),
  special_needs: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    prescribed_by: z.string().optional()
  })).optional(),
  photo_url: z.string().url().optional()
});

const updatePetSchema = createPetSchema.partial().omit({ customer_id: true });

// GET /pets - List all pets with filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const customer_id = req.query.customer_id as string;
  const species = req.query.species as string;
  const breed = req.query.breed as string;
  const age_range = req.query.age_range as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('pets')
      .select(`
        *,
        customers (id, name, phone)
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Apply filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (species && species !== 'all') {
      query = query.eq('species', species);
    }

    if (breed && breed !== 'all') {
      query = query.eq('breed', breed);
    }

    // Age range filtering (requires birth_date)
    if (age_range && age_range !== 'all') {
      const currentDate = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (age_range) {
        case 'young':
          startDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
          endDate = currentDate;
          break;
        case 'adult':
          startDate = new Date(currentDate.getFullYear() - 8, currentDate.getMonth(), currentDate.getDate());
          endDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'senior':
          startDate = new Date(currentDate.getFullYear() - 20, currentDate.getMonth(), currentDate.getDate());
          endDate = new Date(currentDate.getFullYear() - 8, currentDate.getMonth(), currentDate.getDate());
          break;
        default:
          startDate = new Date(0);
          endDate = currentDate;
      }

      query = query.gte('birth_date', startDate.toISOString())
                   .lte('birth_date', endDate.toISOString());
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: pets, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: pets || [],
      message: 'Pets retrieved successfully',
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
    logger.error('Error getting pets:', error);
    throw createError('Erro ao obter pets', 500);
  }
}));

// POST /pets - Create new pet profile
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const validatedData = createPetSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Verify customer exists and belongs to organization
    const { data: customer } = await supabase.supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('organization_id', organizationId)
      .single();

    if (!customer) {
      throw createError('Cliente não encontrado', 404);
    }

    const { data: pet, error } = await supabase.supabase
      .from('pets')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        customers (id, name, phone)
      `)
      .single();

    if (error) throw error;

    logger.info('Pet created', { petId: pet.id, customerId: validatedData.customer_id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: pet,
      message: 'Pet criado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating pet:', error);
    throw createError('Erro ao criar pet', 500);
  }
}));

// GET /pets/:id - Get specific pet details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: pet, error } = await supabase.supabase
      .from('pets')
      .select(`
        *,
        customers (id, name, phone, email),
        health_records (*),
        appointments (
          id,
          title,
          appointment_date,
          status,
          notes,
          estimated_cost,
          actual_cost
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Pet não encontrado', 404);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: pet,
      message: 'Pet details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pet:', error);
    throw createError('Erro ao obter pet', 500);
  }
}));

// PUT /pets/:id - Update pet information
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const validatedData = updatePetSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: pet, error } = await supabase.supabase
      .from('pets')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .select(`
        *,
        customers (id, name, phone)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Pet não encontrado', 404);
      }
      throw error;
    }

    logger.info('Pet updated', { petId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: pet,
      message: 'Pet atualizado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating pet:', error);
    throw createError('Erro ao atualizar pet', 500);
  }
}));

// DELETE /pets/:id - Soft delete pet
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Check if pet has active appointments
    const { data: activeAppointments } = await supabase.supabase
      .from('appointments')
      .select('id')
      .eq('pet_id', id)
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (activeAppointments && activeAppointments.length > 0) {
      throw createError('Não é possível excluir pet com agendamentos ativos', 409);
    }

    const { data: pet, error } = await supabase.supabase
      .from('pets')
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
        throw createError('Pet não encontrado', 404);
      }
      throw error;
    }

    logger.info('Pet soft deleted', { petId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: pet,
      message: 'Pet desativado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deleting pet:', error);
    throw createError('Erro ao excluir pet', 500);
  }
}));

// POST /pets/:id/photo - Upload pet photo
router.post('/:id/photo', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;
  const { photo_url } = req.body;

  if (!photo_url) {
    throw createError('URL da foto é obrigatória', 400);
  }

  try {
    const supabase = getSupabaseService();

    const { data: pet, error } = await supabase.supabase
      .from('pets')
      .update({
        photo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Pet não encontrado', 404);
      }
      throw error;
    }

    logger.info('Pet photo updated', { petId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: pet,
      message: 'Foto do pet atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating pet photo:', error);
    throw createError('Erro ao atualizar foto', 500);
  }
}));

// GET /pets/:id/health-records - Get pet's health history
router.get('/:id/health-records', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Verify pet exists and belongs to organization
    const { data: pet } = await supabase.supabase
      .from('pets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!pet) {
      throw createError('Pet não encontrado', 404);
    }

    const { data: healthRecords, error } = await supabase.supabase
      .from('health_records')
      .select('*')
      .eq('pet_id', id)
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: healthRecords || [],
      message: 'Pet health records retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pet health records:', error);
    throw createError('Erro ao obter histórico médico', 500);
  }
}));

// POST /pets/:id/health-records - Add health record
router.post('/:id/health-records', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  const healthRecordSchema = z.object({
    type: z.enum(['vaccination', 'consultation', 'surgery', 'treatment', 'exam', 'medication']),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    date: z.string().datetime(),
    veterinarian: z.string().optional(),
    cost: z.number().positive().optional(),
    next_appointment: z.string().datetime().optional(),
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string()
    })).optional(),
    attachments: z.array(z.string().url()).optional()
  });

  try {
    const validatedData = healthRecordSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Verify pet exists and belongs to organization
    const { data: pet } = await supabase.supabase
      .from('pets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!pet) {
      throw createError('Pet não encontrado', 404);
    }

    const { data: healthRecord, error } = await supabase.supabase
      .from('health_records')
      .insert({
        ...validatedData,
        pet_id: id,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Health record added', { petId: id, recordId: healthRecord.id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: healthRecord,
      message: 'Registro médico adicionado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error adding health record:', error);
    throw createError('Erro ao adicionar registro médico', 500);
  }
}));

// GET /pets/:id/appointments - Get pet's appointments
router.get('/:id/appointments', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Verify pet exists and belongs to organization
    const { data: pet } = await supabase.supabase
      .from('pets')
      .select('id, name, customers(id, name)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!pet) {
      throw createError('Pet não encontrado', 404);
    }

    const { data: appointments, error } = await supabase.supabase
      .from('appointments')
      .select(`
        *,
        customers (id, name, phone),
        staff:assigned_to (id, name)
      `)
      .eq('pet_id', id)
      .eq('organization_id', organizationId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: appointments || [],
      message: 'Pet appointments retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pet appointments:', error);
    throw createError('Erro ao obter agendamentos do pet', 500);
  }
}));

export default router;