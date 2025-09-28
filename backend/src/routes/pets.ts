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

// Enhanced validation schemas
const createPetSchema = z.object({
  customer_id: z.string().uuid('Customer ID inválido'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  species: z.enum(['cat', 'dog', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'], {
    errorMap: () => ({ message: 'Espécie deve ser: cat, dog, bird, rabbit, hamster, fish, reptile ou other' })
  }),
  breed: z.string().max(50, 'Raça deve ter no máximo 50 caracteres').optional(),
  color: z.string().max(30, 'Cor deve ter no máximo 30 caracteres').optional(),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  birth_date: z.string().datetime('Data de nascimento inválida').optional(),
  weight: z.number().positive('Peso deve ser positivo').max(200, 'Peso máximo de 200kg').optional(),
  microchip_number: z.string()
    .regex(/^[0-9A-Fa-f]{15}$/, 'Microchip deve ter 15 caracteres hexadecimais')
    .optional(),
  special_needs: z.string().max(500, 'Necessidades especiais devem ter no máximo 500 caracteres').optional(),
  allergies: z.array(z.string().max(100)).max(20, 'Máximo 20 alergias').optional(),
  medications: z.array(z.object({
    name: z.string().min(1, 'Nome do medicamento obrigatório').max(100),
    dosage: z.string().min(1, 'Dosagem obrigatória').max(50),
    frequency: z.string().max(50).optional(),
    prescribed_by: z.string().max(100).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    notes: z.string().max(200).optional()
  })).max(10, 'Máximo 10 medicamentos').optional(),
  photo_url: z.string().url('URL da foto inválida').optional(),
  emergency_contact: z.object({
    name: z.string().max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido').optional(),
    relationship: z.string().max(50).optional()
  }).optional(),
  insurance_info: z.object({
    provider: z.string().max(100).optional(),
    policy_number: z.string().max(50).optional(),
    coverage_details: z.string().max(500).optional()
  }).optional()
});

const updatePetSchema = createPetSchema.partial().omit({ customer_id: true });

// Pet search and filter schema
const petSearchSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1') || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20') || 20, 100)),
  customer_id: z.string().uuid().optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  age_range: z.enum(['young', 'adult', 'senior', 'all']).default('all'),
  weight_range: z.string().regex(/^\d+-\d+$/).optional(),
  has_allergies: z.string().transform(val => val === 'true').optional(),
  has_medications: z.string().transform(val => val === 'true').optional(),
  has_special_needs: z.string().transform(val => val === 'true').optional(),
  search: z.string().max(100).optional()
});

// GET /pets - List all pets with advanced filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  try {
    const filters = petSearchSchema.parse(req.query);
    const supabase = getSupabaseService();

    let query = supabase.supabase
      .from('pets')
      .select(`
        *,
        customers (id, name, phone, email),
        appointments (
          count
        ),
        health_records (
          count
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Apply filters
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.species && filters.species !== 'all') {
      query = query.eq('species', filters.species);
    }

    if (filters.breed && filters.breed !== 'all') {
      query = query.ilike('breed', `%${filters.breed}%`);
    }

    // Age range filtering
    if (filters.age_range !== 'all') {
      const currentDate = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (filters.age_range) {
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

    // Weight range filtering
    if (filters.weight_range) {
      const [minWeight, maxWeight] = filters.weight_range.split('-').map(Number);
      query = query.gte('weight', minWeight).lte('weight', maxWeight);
    }

    // Boolean filters
    if (filters.has_allergies !== undefined) {
      if (filters.has_allergies) {
        query = query.not('allergies', 'is', null);
      } else {
        query = query.or('allergies.is.null,allergies.eq.{}');
      }
    }

    if (filters.has_medications !== undefined) {
      if (filters.has_medications) {
        query = query.not('medications', 'is', null);
      } else {
        query = query.or('medications.is.null,medications.eq.{}');
      }
    }

    if (filters.has_special_needs !== undefined) {
      if (filters.has_special_needs) {
        query = query.not('special_needs', 'is', null);
      } else {
        query = query.or('special_needs.is.null,special_needs.eq.""');
      }
    }

    // Text search
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,` +
        `breed.ilike.%${filters.search}%,` +
        `color.ilike.%${filters.search}%,` +
        `microchip_number.ilike.%${filters.search}%`
      );
    }

    // Apply pagination and sorting
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: pets, error, count } = await query;

    if (error) throw error;

    // Calculate age for each pet
    const enrichedPets = (pets || []).map(pet => {
      let age = null;
      if (pet.birth_date) {
        const birthDate = new Date(pet.birth_date);
        const ageDiff = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDiff);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }

      return {
        ...pet,
        age,
        appointment_count: pet.appointments?.length || 0,
        health_record_count: pet.health_records?.length || 0
      };
    });

    const totalPages = Math.ceil((count || 0) / filters.limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: enrichedPets,
      message: 'Pets retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pets:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de busca inválidos', 400);
    }
    throw createError('Erro ao obter pets', 500);
  }
}));

// POST /pets - Create new pet profile
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
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

// GET /pets/stats - Pet statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  try {
    const supabase = getSupabaseService();

    // Get total pets count
    const { count: totalPets } = await supabase.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get species distribution
    const { data: speciesData } = await supabase.supabase
      .from('pets')
      .select('species')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const speciesDistribution = speciesData?.reduce((acc, pet) => {
      acc[pet.species] = (acc[pet.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get age distribution
    const { data: petsWithBirthDate } = await supabase.supabase
      .from('pets')
      .select('birth_date')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('birth_date', 'is', null);

    const ageDistribution = { young: 0, adult: 0, senior: 0, unknown: 0 };
    const currentDate = new Date();

    petsWithBirthDate?.forEach(pet => {
      if (pet.birth_date) {
        const birthDate = new Date(pet.birth_date);
        const ageDiff = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDiff);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        if (age < 2) ageDistribution.young++;
        else if (age < 8) ageDistribution.adult++;
        else ageDistribution.senior++;
      } else {
        ageDistribution.unknown++;
      }
    });

    // Get pets with special conditions
    const { count: petsWithAllergies } = await supabase.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('allergies', 'is', null);

    const { count: petsWithMedications } = await supabase.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('medications', 'is', null);

    const { count: petsWithSpecialNeeds } = await supabase.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('special_needs', 'is', null);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentRegistrations } = await supabase.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const stats = {
      total_pets: totalPets || 0,
      species_distribution: speciesDistribution,
      age_distribution: ageDistribution,
      pets_with_allergies: petsWithAllergies || 0,
      pets_with_medications: petsWithMedications || 0,
      pets_with_special_needs: petsWithSpecialNeeds || 0,
      recent_registrations: recentRegistrations || 0
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Pet statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pet statistics:', error);
    throw createError('Erro ao obter estatísticas de pets', 500);
  }
}));

// GET /pets/breeds - Get popular breeds by species
router.get('/breeds/popular', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const species = req.query.species as string;

  try {
    const supabase = getSupabaseService();

    let query = supabase.supabase
      .from('pets')
      .select('breed')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('breed', 'is', null);

    if (species) {
      query = query.eq('species', species);
    }

    const { data: breedData } = await query;

    const breedCounts = breedData?.reduce((acc, pet) => {
      if (pet.breed) {
        acc[pet.breed] = (acc[pet.breed] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Sort by count and get top 10
    const popularBreeds = Object.entries(breedCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([breed, count]) => ({ breed, count }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: popularBreeds,
      message: 'Popular breeds retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting popular breeds:', error);
    throw createError('Erro ao obter raças populares', 500);
  }
}));

// POST /pets/bulk-import - Bulk import pets from CSV
router.post('/bulk-import', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const bulkImportSchema = z.object({
    pets: z.array(createPetSchema).min(1, 'Pelo menos um pet é obrigatório').max(100, 'Máximo 100 pets por importação')
  });

  try {
    const { pets } = bulkImportSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Validate all customer IDs exist
    const customerIds = [...new Set(pets.map(pet => pet.customer_id))];
    const { data: existingCustomers } = await supabase.supabase
      .from('customers')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', customerIds);

    const validCustomerIds = new Set(existingCustomers?.map(c => c.id) || []);
    const invalidPets = pets.filter(pet => !validCustomerIds.has(pet.customer_id));

    if (invalidPets.length > 0) {
      throw createError(
        `Clientes não encontrados para ${invalidPets.length} pets`,
        400
      );
    }

    // Prepare data for insertion
    const petsToInsert = pets.map(pet => ({
      ...pet,
      organization_id: organizationId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: insertedPets, error } = await supabase.supabase
      .from('pets')
      .insert(petsToInsert)
      .select(`
        *,
        customers (id, name, phone)
      `);

    if (error) throw error;

    logger.info('Bulk pet import completed', {
      count: insertedPets?.length || 0,
      organizationId
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: insertedPets || [],
      message: `${insertedPets?.length || 0} pets importados com sucesso`,
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error bulk importing pets:', error);
    if (error.name === 'ZodError') {
      throw createError('Dados de importação inválidos', 400);
    }
    throw createError('Erro ao importar pets', 500);
  }
}));

export default router;