import { SupabaseService } from './supabase';
import { logger } from '../utils/logger';

export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  customer_id?: string;
  pet_id?: string;
  service_type?: string;
  status?: string;
  veterinarian_id?: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  include_headers?: boolean;
  date_format?: string;
}

export class ReportsService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  // Financial Reports
  async generateFinancialReport(organizationId: string, filters: ReportFilter) {
    try {
      const { start_date, end_date, service_type } = filters;

      let query = this.supabaseService.supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          service_type,
          price,
          actual_cost,
          status,
          customers (id, name, email),
          pets (id, name, species),
          veterinarian:veterinarian_id (id, full_name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      if (start_date) {
        query = query.gte('appointment_date', start_date);
      }

      if (end_date) {
        query = query.lte('appointment_date', end_date);
      }

      if (service_type) {
        query = query.eq('service_type', service_type);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      // Calculate financial metrics
      const totalRevenue = appointments?.reduce((sum, apt) =>
        sum + (apt.actual_cost || apt.price || 0), 0) || 0;

      const serviceBreakdown = appointments?.reduce((acc, apt) => {
        const revenue = apt.actual_cost || apt.price || 0;
        acc[apt.service_type] = (acc[apt.service_type] || 0) + revenue;
        return acc;
      }, {} as Record<string, number>) || {};

      const monthlyRevenue = appointments?.reduce((acc, apt) => {
        const month = apt.appointment_date.substring(0, 7); // YYYY-MM
        const revenue = apt.actual_cost || apt.price || 0;
        acc[month] = (acc[month] || 0) + revenue;
        return acc;
      }, {} as Record<string, number>) || {};

      const averageTransactionValue = appointments && appointments.length > 0 ?
        totalRevenue / appointments.length : 0;

      return {
        period: { start_date, end_date },
        summary: {
          total_revenue: totalRevenue,
          total_appointments: appointments?.length || 0,
          average_transaction_value: averageTransactionValue
        },
        breakdown: {
          by_service: serviceBreakdown,
          by_month: monthlyRevenue
        },
        appointments: appointments || []
      };
    } catch (error) {
      logger.error('Error generating financial report:', error);
      throw error;
    }
  }

  // Customer Activity Report
  async generateCustomerActivityReport(organizationId: string, filters: ReportFilter) {
    try {
      const { start_date, end_date, customer_id } = filters;

      let customerQuery = this.supabaseService.supabase
        .from('customers')
        .select(`
          *,
          pets (
            id,
            name,
            species,
            breed,
            appointments (
              id,
              appointment_date,
              service_type,
              status,
              price,
              actual_cost
            )
          )
        `)
        .eq('organization_id', organizationId);

      if (customer_id) {
        customerQuery = customerQuery.eq('id', customer_id);
      }

      const { data: customers, error } = await customerQuery;

      if (error) throw error;

      // Process customer data
      const customerActivity = customers?.map(customer => {
        const allAppointments = customer.pets?.flatMap(pet => pet.appointments || []) || [];

        // Filter appointments by date range
        const filteredAppointments = allAppointments.filter(apt => {
          const aptDate = apt.appointment_date;
          if (start_date && aptDate < start_date) return false;
          if (end_date && aptDate > end_date) return false;
          return true;
        });

        const totalSpent = filteredAppointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + (apt.actual_cost || apt.price || 0), 0);

        const lastVisit = filteredAppointments.length > 0 ?
          Math.max(...filteredAppointments.map(apt => new Date(apt.appointment_date).getTime())) : null;

        return {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          pets_count: customer.pets?.length || 0,
          appointments_count: filteredAppointments.length,
          total_spent: totalSpent,
          last_visit: lastVisit ? new Date(lastVisit).toISOString() : null,
          appointments: filteredAppointments
        };
      }) || [];

      // Sort by total spent (descending)
      customerActivity.sort((a, b) => b.total_spent - a.total_spent);

      const totalCustomers = customerActivity.length;
      const activeCustomers = customerActivity.filter(c => c.appointments_count > 0).length;
      const totalRevenue = customerActivity.reduce((sum, c) => sum + c.total_spent, 0);
      const averageSpentPerCustomer = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

      return {
        period: { start_date, end_date },
        summary: {
          total_customers: totalCustomers,
          active_customers: activeCustomers,
          total_revenue: totalRevenue,
          average_spent_per_customer: averageSpentPerCustomer
        },
        customers: customerActivity
      };
    } catch (error) {
      logger.error('Error generating customer activity report:', error);
      throw error;
    }
  }

  // Pet Health Report
  async generatePetHealthReport(organizationId: string, filters: ReportFilter) {
    try {
      const { start_date, end_date, pet_id, customer_id } = filters;

      let query = this.supabaseService.supabase
        .from('pets')
        .select(`
          *,
          customers (id, name, phone),
          health_records (*),
          appointments (
            id,
            appointment_date,
            service_type,
            status,
            notes,
            completion_notes
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (pet_id) {
        query = query.eq('id', pet_id);
      }

      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }

      const { data: pets, error } = await query;

      if (error) throw error;

      // Process pet health data
      const petHealthData = pets?.map(pet => {
        // Filter health records by date
        const filteredHealthRecords = pet.health_records?.filter(record => {
          if (start_date && record.date < start_date) return false;
          if (end_date && record.date > end_date) return false;
          return true;
        }) || [];

        // Filter appointments by date
        const filteredAppointments = pet.appointments?.filter(apt => {
          if (start_date && apt.appointment_date < start_date) return false;
          if (end_date && apt.appointment_date > end_date) return false;
          return true;
        }) || [];

        // Calculate age
        let age = null;
        if (pet.birth_date) {
          const birthDate = new Date(pet.birth_date);
          const ageDiff = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDiff);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        // Analyze health conditions
        const hasAllergies = pet.allergies && pet.allergies.length > 0;
        const onMedications = pet.medications && pet.medications.length > 0;
        const hasSpecialNeeds = !!pet.special_needs;

        const lastHealthRecord = filteredHealthRecords.length > 0 ?
          filteredHealthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

        const lastAppointment = filteredAppointments.length > 0 ?
          filteredAppointments.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0] : null;

        return {
          pet_id: pet.id,
          pet_name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age,
          customer: pet.customers,
          health_status: {
            has_allergies: hasAllergies,
            allergies: pet.allergies || [],
            on_medications: onMedications,
            medications: pet.medications || [],
            has_special_needs: hasSpecialNeeds,
            special_needs: pet.special_needs
          },
          health_records_count: filteredHealthRecords.length,
          appointments_count: filteredAppointments.length,
          last_health_record: lastHealthRecord,
          last_appointment: lastAppointment,
          health_records: filteredHealthRecords,
          appointments: filteredAppointments
        };
      }) || [];

      // Generate health statistics
      const totalPets = petHealthData.length;
      const petsWithAllergies = petHealthData.filter(p => p.health_status.has_allergies).length;
      const petsOnMedications = petHealthData.filter(p => p.health_status.on_medications).length;
      const petsWithSpecialNeeds = petHealthData.filter(p => p.health_status.has_special_needs).length;

      const speciesDistribution = petHealthData.reduce((acc, pet) => {
        acc[pet.species] = (acc[pet.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        period: { start_date, end_date },
        summary: {
          total_pets: totalPets,
          pets_with_allergies: petsWithAllergies,
          pets_on_medications: petsOnMedications,
          pets_with_special_needs: petsWithSpecialNeeds,
          species_distribution: speciesDistribution
        },
        pets: petHealthData
      };
    } catch (error) {
      logger.error('Error generating pet health report:', error);
      throw error;
    }
  }

  // Appointment Analytics Report
  async generateAppointmentReport(organizationId: string, filters: ReportFilter) {
    try {
      const { start_date, end_date, service_type, status, veterinarian_id } = filters;

      let query = this.supabaseService.supabase
        .from('appointments')
        .select(`
          *,
          customers (id, name, phone),
          pets (id, name, species, breed),
          veterinarian:veterinarian_id (id, full_name)
        `)
        .eq('organization_id', organizationId)
        .order('appointment_date', { ascending: false });

      if (start_date) {
        query = query.gte('appointment_date', start_date);
      }

      if (end_date) {
        query = query.lte('appointment_date', end_date);
      }

      if (service_type) {
        query = query.eq('service_type', service_type);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (veterinarian_id) {
        query = query.eq('veterinarian_id', veterinarian_id);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      // Analyze appointment data
      const statusDistribution = appointments?.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const serviceDistribution = appointments?.reduce((acc, apt) => {
        acc[apt.service_type] = (acc[apt.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const veterinarianWorkload = appointments?.reduce((acc, apt) => {
        if (apt.veterinarian_id) {
          const vetName = (apt.veterinarian as any)?.full_name || 'Unknown';
          acc[vetName] = (acc[vetName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Daily appointment count
      const dailyCount = appointments?.reduce((acc, apt) => {
        const date = apt.appointment_date.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate average duration and completion rate
      const totalDuration = appointments?.reduce((sum, apt) => sum + apt.duration_minutes, 0) || 0;
      const avgDuration = appointments && appointments.length > 0 ? totalDuration / appointments.length : 0;

      const completedAppointments = statusDistribution.completed || 0;
      const completionRate = appointments && appointments.length > 0 ?
        (completedAppointments / appointments.length) * 100 : 0;

      return {
        period: { start_date, end_date },
        summary: {
          total_appointments: appointments?.length || 0,
          completion_rate: completionRate,
          average_duration_minutes: avgDuration,
          status_distribution: statusDistribution,
          service_distribution: serviceDistribution,
          veterinarian_workload: veterinarianWorkload
        },
        daily_count: dailyCount,
        appointments: appointments || []
      };
    } catch (error) {
      logger.error('Error generating appointment report:', error);
      throw error;
    }
  }

  // Export functions
  async exportToCSV(data: any[], filename: string): Promise<string> {
    try {
      if (!data || data.length === 0) {
        return '';
      }

      // Get headers from the first object
      const headers = Object.keys(data[0]);

      // Create CSV content
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      logger.info(`CSV export generated: ${filename}`, {
        rows: data.length,
        columns: headers.length
      });

      return csvContent;
    } catch (error) {
      logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  async exportToJSON(data: any, filename: string): Promise<string> {
    try {
      const jsonContent = JSON.stringify(data, null, 2);

      logger.info(`JSON export generated: ${filename}`, {
        size: jsonContent.length
      });

      return jsonContent;
    } catch (error) {
      logger.error('Error exporting to JSON:', error);
      throw error;
    }
  }

  // Comprehensive business report
  async generateBusinessReport(organizationId: string, filters: ReportFilter) {
    try {
      const [
        financialData,
        customerData,
        petHealthData,
        appointmentData
      ] = await Promise.all([
        this.generateFinancialReport(organizationId, filters),
        this.generateCustomerActivityReport(organizationId, filters),
        this.generatePetHealthReport(organizationId, filters),
        this.generateAppointmentReport(organizationId, filters)
      ]);

      return {
        report_generated: new Date().toISOString(),
        period: filters,
        organization_id: organizationId,
        financial_overview: financialData.summary,
        customer_overview: customerData.summary,
        pet_health_overview: petHealthData.summary,
        appointment_overview: appointmentData.summary,
        detailed_data: {
          financial: financialData,
          customers: customerData,
          pet_health: petHealthData,
          appointments: appointmentData
        }
      };
    } catch (error) {
      logger.error('Error generating business report:', error);
      throw error;
    }
  }
}