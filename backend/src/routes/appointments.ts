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
const createAppointmentSchema = z.object({
  customer_id: z.string().uuid('Customer ID inválido'),
  pet_id: z.string().uuid('Pet ID inválido'),
  assigned_to: z.string().uuid('Staff ID inválido').optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  appointment_type: z.string().min(1, 'Tipo de agendamento é obrigatório'),
  appointment_date: z.string().datetime('Data/hora inválida'),
  estimated_duration_minutes: z.number().positive().default(60),
  estimated_cost: z.number().positive().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('scheduled')
});

const updateAppointmentSchema = createAppointmentSchema.partial().omit({ customer_id: true, pet_id: true });

// GET /appointments - List appointments with filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const date = req.query.date as string;
  const date_range = req.query.date_range as string;
  const status = req.query.status as string;
  const assigned_to = req.query.assigned_to as string;
  const customer_id = req.query.customer_id as string;
  const pet_id = req.query.pet_id as string;
  const type = req.query.type as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('appointments')
      .select(`
        *,
        customers (id, name, phone),
        pets (id, name, species, breed),
        staff:assigned_to (id, name)
      `, { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte('appointment_date', startOfDay).lte('appointment_date', endOfDay);
    }

    if (date_range) {
      const [startDate, endDate] = date_range.split(',');
      if (startDate) query = query.gte('appointment_date', `${startDate}T00:00:00.000Z`);
      if (endDate) query = query.lte('appointment_date', `${endDate}T23:59:59.999Z`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (pet_id) {
      query = query.eq('pet_id', pet_id);
    }

    if (type && type !== 'all') {
      query = query.eq('appointment_type', type);
    }

    // Apply pagination and sorting
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('appointment_date', { ascending: true });

    const { data: appointments, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: appointments || [],
      message: 'Appointments retrieved successfully',
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
    logger.error('Error getting appointments:', error);
    throw createError('Erro ao obter agendamentos', 500);
  }
}));

// POST /appointments - Create new appointment
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Verify customer and pet exist and belong to organization
    const { data: customer } = await supabase.supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('organization_id', organizationId)
      .single();

    if (!customer) {
      throw createError('Cliente não encontrado', 404);
    }

    const { data: pet } = await supabase.supabase
      .from('pets')
      .select('id')
      .eq('id', validatedData.pet_id)
      .eq('customer_id', validatedData.customer_id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!pet) {
      throw createError('Pet não encontrado', 404);
    }

    // Check for appointment conflicts if assigned_to is provided
    if (validatedData.assigned_to) {
      const appointmentStart = new Date(validatedData.appointment_date);
      const appointmentEnd = new Date(appointmentStart.getTime() + (validatedData.estimated_duration_minutes * 60000));

      const { data: conflicts } = await supabase.supabase
        .from('appointments')
        .select('id')
        .eq('assigned_to', validatedData.assigned_to)
        .eq('organization_id', organizationId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .gte('appointment_date', appointmentStart.toISOString())
        .lt('appointment_date', appointmentEnd.toISOString());

      if (conflicts && conflicts.length > 0) {
        throw createError('Conflito de horário com outro agendamento', 409);
      }
    }

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        customers (id, name, phone),
        pets (id, name, species, breed),
        staff:assigned_to (id, name)
      `)
      .single();

    if (error) throw error;

    logger.info('Appointment created', { appointmentId: appointment.id, customerId: validatedData.customer_id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento criado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating appointment:', error);
    throw createError('Erro ao criar agendamento', 500);
  }
}));

// GET /appointments/:id - Get appointment details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .select(`
        *,
        customers (id, name, phone, email),
        pets (id, name, species, breed, color, weight),
        staff:assigned_to (id, name, email),
        appointment_notes (*),
        appointment_files (*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado', 404);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Appointment details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting appointment:', error);
    throw createError('Erro ao obter agendamento', 500);
  }
}));

// PUT /appointments/:id - Update appointment
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  try {
    const validatedData = updateAppointmentSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Check for appointment conflicts if changing assigned_to or appointment_date
    if (validatedData.assigned_to || validatedData.appointment_date) {
      // Get current appointment data
      const { data: currentAppointment } = await supabase.supabase
        .from('appointments')
        .select('appointment_date, estimated_duration_minutes, assigned_to')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (!currentAppointment) {
        throw createError('Agendamento não encontrado', 404);
      }

      const appointmentDate = validatedData.appointment_date || currentAppointment.appointment_date;
      const assignedTo = validatedData.assigned_to || currentAppointment.assigned_to;
      const duration = validatedData.estimated_duration_minutes || currentAppointment.estimated_duration_minutes;

      if (assignedTo) {
        const appointmentStart = new Date(appointmentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + (duration * 60000));

        const { data: conflicts } = await supabase.supabase
          .from('appointments')
          .select('id')
          .eq('assigned_to', assignedTo)
          .eq('organization_id', organizationId)
          .neq('id', id) // Exclude current appointment
          .in('status', ['scheduled', 'confirmed', 'in_progress'])
          .gte('appointment_date', appointmentStart.toISOString())
          .lt('appointment_date', appointmentEnd.toISOString());

        if (conflicts && conflicts.length > 0) {
          throw createError('Conflito de horário com outro agendamento', 409);
        }
      }
    }

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        customers (id, name, phone),
        pets (id, name, species, breed),
        staff:assigned_to (id, name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado', 404);
      }
      throw error;
    }

    logger.info('Appointment updated', { appointmentId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento atualizado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating appointment:', error);
    throw createError('Erro ao atualizar agendamento', 500);
  }
}));

// DELETE /appointments/:id - Cancel appointment
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado', 404);
      }
      throw error;
    }

    logger.info('Appointment cancelled', { appointmentId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento cancelado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error cancelling appointment:', error);
    throw createError('Erro ao cancelar agendamento', 500);
  }
}));

// POST /appointments/:id/confirm - Confirm appointment
router.post('/:id/confirm', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'scheduled')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado ou já confirmado', 404);
      }
      throw error;
    }

    logger.info('Appointment confirmed', { appointmentId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento confirmado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error confirming appointment:', error);
    throw createError('Erro ao confirmar agendamento', 500);
  }
}));

// POST /appointments/:id/start - Start appointment
router.post('/:id/start', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'confirmed'])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado ou não pode ser iniciado', 404);
      }
      throw error;
    }

    logger.info('Appointment started', { appointmentId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento iniciado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error starting appointment:', error);
    throw createError('Erro ao iniciar agendamento', 500);
  }
}));

// POST /appointments/:id/complete - Complete appointment
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  const completeSchema = z.object({
    notes: z.string().optional(),
    actual_cost: z.number().positive().optional(),
    next_appointment_recommended: z.boolean().default(false),
    next_appointment_date: z.string().datetime().optional(),
    medications_prescribed: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string()
    })).optional()
  });

  try {
    const validatedData = completeSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_cost: validatedData.actual_cost,
        completion_notes: validatedData.notes,
        next_appointment_recommended: validatedData.next_appointment_recommended,
        next_appointment_date: validatedData.next_appointment_date,
        medications_prescribed: validatedData.medications_prescribed,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'in_progress')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Agendamento não encontrado ou não pode ser completado', 404);
      }
      throw error;
    }

    logger.info('Appointment completed', { appointmentId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento finalizado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error completing appointment:', error);
    throw createError('Erro ao finalizar agendamento', 500);
  }
}));

// GET /appointments/calendar - Calendar view data
router.get('/calendar/view', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  const start_date = req.query.start_date as string;
  const end_date = req.query.end_date as string;

  if (!start_date || !end_date) {
    throw createError('start_date e end_date são obrigatórios', 400);
  }

  try {
    const supabase = getSupabaseService();
    const { data: appointments, error } = await supabase.supabase
      .from('appointments')
      .select(`
        id,
        title,
        appointment_date,
        estimated_duration_minutes,
        status,
        appointment_type,
        customers (id, name),
        pets (id, name, species),
        staff:assigned_to (id, name)
      `)
      .eq('organization_id', organizationId)
      .gte('appointment_date', `${start_date}T00:00:00.000Z`)
      .lte('appointment_date', `${end_date}T23:59:59.999Z`)
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    // Transform appointments for calendar format
    const calendarEvents = (appointments || []).map(apt => ({
      id: apt.id,
      title: `${apt.title} - ${apt.customers.name}`,
      start: apt.appointment_date,
      end: new Date(new Date(apt.appointment_date).getTime() + (apt.estimated_duration_minutes * 60000)).toISOString(),
      extendedProps: {
        customer: apt.customers,
        pet: apt.pets,
        staff: apt.staff,
        status: apt.status,
        type: apt.appointment_type
      }
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: calendarEvents,
      message: 'Calendar appointments retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting calendar appointments:', error);
    throw createError('Erro ao obter agendamentos do calendário', 500);
  }
}));

// GET /appointments/availability - Check staff/resource availability
router.get('/availability/check', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';

  const date = req.query.date as string;
  const staff_id = req.query.staff_id as string;
  const duration = parseInt(req.query.duration as string) || 60;

  if (!date) {
    throw createError('date é obrigatório', 400);
  }

  try {
    const supabase = getSupabaseService();

    // Get existing appointments for the date
    let query = supabase.supabase
      .from('appointments')
      .select('appointment_date, estimated_duration_minutes, assigned_to')
      .eq('organization_id', organizationId)
      .gte('appointment_date', `${date}T00:00:00.000Z`)
      .lte('appointment_date', `${date}T23:59:59.999Z`)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (staff_id) {
      query = query.eq('assigned_to', staff_id);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    // Generate available time slots (assuming 8am to 6pm working hours)
    const workStart = 8; // 8 AM
    const workEnd = 18; // 6 PM
    const slotDuration = duration; // minutes
    const availableSlots = [];

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`);
        const slotEnd = new Date(slotStart.getTime() + (slotDuration * 60000));

        // Check if slot conflicts with existing appointments
        const hasConflict = appointments?.some(apt => {
          const aptStart = new Date(apt.appointment_date);
          const aptEnd = new Date(aptStart.getTime() + (apt.estimated_duration_minutes * 60000));

          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        if (!hasConflict) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: true
          });
        }
      }
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: availableSlots,
      message: 'Availability check completed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error checking availability:', error);
    throw createError('Erro ao verificar disponibilidade', 500);
  }
}));

// POST /appointments/:id/reschedule - Reschedule appointment
router.post('/:id/reschedule', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || 'default-org';
  const { id } = req.params;

  const rescheduleSchema = z.object({
    new_appointment_date: z.string().datetime('Nova data/hora inválida'),
    reason: z.string().optional()
  });

  try {
    const validatedData = rescheduleSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Get current appointment
    const { data: currentAppointment } = await supabase.supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!currentAppointment) {
      throw createError('Agendamento não encontrado', 404);
    }

    if (currentAppointment.status === 'completed' || currentAppointment.status === 'cancelled') {
      throw createError('Não é possível reagendar um agendamento finalizado ou cancelado', 409);
    }

    // Check for conflicts at new time
    if (currentAppointment.assigned_to) {
      const appointmentStart = new Date(validatedData.new_appointment_date);
      const appointmentEnd = new Date(appointmentStart.getTime() + (currentAppointment.estimated_duration_minutes * 60000));

      const { data: conflicts } = await supabase.supabase
        .from('appointments')
        .select('id')
        .eq('assigned_to', currentAppointment.assigned_to)
        .eq('organization_id', organizationId)
        .neq('id', id)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .gte('appointment_date', appointmentStart.toISOString())
        .lt('appointment_date', appointmentEnd.toISOString());

      if (conflicts && conflicts.length > 0) {
        throw createError('Conflito de horário com outro agendamento', 409);
      }
    }

    // Update appointment
    const { data: appointment, error } = await supabase.supabase
      .from('appointments')
      .update({
        appointment_date: validatedData.new_appointment_date,
        rescheduled_from: currentAppointment.appointment_date,
        reschedule_reason: validatedData.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        customers (id, name, phone),
        pets (id, name, species),
        staff:assigned_to (id, name)
      `)
      .single();

    if (error) throw error;

    logger.info('Appointment rescheduled', {
      appointmentId: id,
      oldDate: currentAppointment.appointment_date,
      newDate: validatedData.new_appointment_date,
      organizationId
    });

    const response: ApiResponse<any> = {
      success: true,
      data: appointment,
      message: 'Agendamento reagendado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error rescheduling appointment:', error);
    throw createError('Erro ao reagendar agendamento', 500);
  }
}));

export default router;