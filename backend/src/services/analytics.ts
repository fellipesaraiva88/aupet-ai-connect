import { SupabaseService } from './supabase';
import { logger } from '../utils/logger';

export class AnalyticsService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  // Dashboard Overview Analytics
  async getDashboardOverview(organizationId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);

      // Execute multiple queries concurrently for better performance
      const [
        totalCustomers,
        totalPets,
        totalAppointments,
        todayAppointments,
        weeklyRevenue,
        monthlyRevenue,
        activeConversations,
        pendingAppointments
      ] = await Promise.all([
        this.getTotalCustomers(organizationId),
        this.getTotalPets(organizationId),
        this.getTotalAppointments(organizationId),
        this.getTodayAppointments(organizationId),
        this.getRevenueByPeriod(organizationId, lastWeek.toISOString()),
        this.getRevenueByPeriod(organizationId, lastMonth.toISOString()),
        this.getActiveConversations(organizationId),
        this.getPendingAppointments(organizationId)
      ]);

      // Calculate growth rates
      const lastWeekCustomers = await this.getCustomersByPeriod(organizationId, lastWeek.toISOString());
      const customerGrowth = this.calculateGrowthRate(totalCustomers, lastWeekCustomers);

      const lastWeekAppointments = await this.getAppointmentsByPeriod(organizationId, lastWeek.toISOString());
      const appointmentGrowth = this.calculateGrowthRate(totalAppointments, lastWeekAppointments);

      return {
        overview: {
          total_customers: totalCustomers,
          total_pets: totalPets,
          total_appointments: totalAppointments,
          today_appointments: todayAppointments,
          active_conversations: activeConversations,
          pending_appointments: pendingAppointments
        },
        revenue: {
          weekly: weeklyRevenue,
          monthly: monthlyRevenue,
          average_per_appointment: weeklyRevenue > 0 ? weeklyRevenue / (await this.getAppointmentsByPeriod(organizationId, lastWeek.toISOString())) : 0
        },
        growth: {
          customers: customerGrowth,
          appointments: appointmentGrowth
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics(organizationId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get revenue by service type
      const { data: revenueByService } = await this.supabaseService.supabase
        .from('appointments')
        .select('service_type, actual_cost, price')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      const serviceRevenue = revenueByService?.reduce((acc, apt) => {
        const revenue = apt.actual_cost || apt.price || 0;
        acc[apt.service_type] = (acc[apt.service_type] || 0) + revenue;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get daily revenue trend
      const dailyRevenue = await this.getDailyRevenueTrend(organizationId, startDate, endDate);

      // Get top customers by revenue
      const topCustomers = await this.getTopCustomersByRevenue(organizationId, startDate, endDate);

      return {
        period,
        total_revenue: Object.values(serviceRevenue).reduce((sum, val) => sum + val, 0),
        service_breakdown: serviceRevenue,
        daily_trend: dailyRevenue,
        top_customers: topCustomers,
        average_per_day: dailyRevenue.length > 0 ?
          dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) / dailyRevenue.length : 0
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  // Appointment Analytics
  async getAppointmentAnalytics(organizationId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Appointment status distribution
      const { data: appointments } = await this.supabaseService.supabase
        .from('appointments')
        .select('status, service_type, appointment_date, duration_minutes, veterinarian_id')
        .eq('organization_id', organizationId)
        .gte('appointment_date', startDate.toISOString());

      const statusDistribution = appointments?.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const serviceTypeDistribution = appointments?.reduce((acc, apt) => {
        acc[apt.service_type] = (acc[apt.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Peak hours analysis
      const hourlyDistribution = appointments?.reduce((acc, apt) => {
        const hour = new Date(apt.appointment_date).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {};

      // Veterinarian workload
      const veterinarianWorkload = appointments?.reduce((acc, apt) => {
        if (apt.veterinarian_id) {
          acc[apt.veterinarian_id] = (acc[apt.veterinarian_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate average duration
      const avgDuration = appointments && appointments.length > 0 ?
        appointments.reduce((sum, apt) => sum + apt.duration_minutes, 0) / appointments.length : 0;

      return {
        period_days: days,
        total_appointments: appointments?.length || 0,
        status_distribution: statusDistribution,
        service_type_distribution: serviceTypeDistribution,
        hourly_distribution: hourlyDistribution,
        veterinarian_workload: veterinarianWorkload,
        average_duration_minutes: avgDuration,
        completion_rate: statusDistribution.completed && appointments?.length ?
          (statusDistribution.completed / appointments.length) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting appointment analytics:', error);
      throw error;
    }
  }

  // Customer Analytics
  async getCustomerAnalytics(organizationId: string) {
    try {
      // Customer acquisition over time
      const acquisitionData = await this.getCustomerAcquisition(organizationId);

      // Customer value analysis
      const customerValue = await this.getCustomerValueAnalysis(organizationId);

      // Customer retention metrics
      const retentionMetrics = await this.getCustomerRetention(organizationId);

      // Pet ownership distribution
      const { data: petOwnership } = await this.supabaseService.supabase
        .from('customers')
        .select(`
          id,
          pets (count)
        `)
        .eq('organization_id', organizationId);

      const petDistribution = petOwnership?.reduce((acc, customer) => {
        const petCount = customer.pets?.length || 0;
        const category = petCount === 0 ? '0' : petCount === 1 ? '1' : petCount <= 3 ? '2-3' : '4+';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        acquisition: acquisitionData,
        value_analysis: customerValue,
        retention_metrics: retentionMetrics,
        pet_ownership_distribution: petDistribution,
        total_customers: petOwnership?.length || 0
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  // Pet Health Analytics
  async getPetHealthAnalytics(organizationId: string) {
    try {
      // Species and breed popularity
      const { data: pets } = await this.supabaseService.supabase
        .from('pets')
        .select('species, breed, birth_date, allergies, medications, special_needs')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      const speciesDistribution = pets?.reduce((acc, pet) => {
        acc[pet.species] = (acc[pet.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Health conditions analysis
      const allergiesCount = pets?.filter(pet => pet.allergies && pet.allergies.length > 0).length || 0;
      const medicationsCount = pets?.filter(pet => pet.medications && pet.medications.length > 0).length || 0;
      const specialNeedsCount = pets?.filter(pet => pet.special_needs).length || 0;

      // Age distribution
      const ageDistribution = { young: 0, adult: 0, senior: 0, unknown: 0 };
      pets?.forEach(pet => {
        if (pet.birth_date) {
          const age = this.calculatePetAge(pet.birth_date);
          if (age < 2) ageDistribution.young++;
          else if (age < 8) ageDistribution.adult++;
          else ageDistribution.senior++;
        } else {
          ageDistribution.unknown++;
        }
      });

      // Most common health issues
      const allAllergies = pets?.flatMap(pet => pet.allergies || []) || [];
      const allergyFrequency = allAllergies.reduce((acc, allergy) => {
        acc[allergy] = (acc[allergy] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topAllergies = Object.entries(allergyFrequency)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([allergy, count]) => ({ allergy, count }));

      return {
        total_pets: pets?.length || 0,
        species_distribution: speciesDistribution,
        age_distribution: ageDistribution,
        health_conditions: {
          with_allergies: allergiesCount,
          on_medications: medicationsCount,
          with_special_needs: specialNeedsCount
        },
        common_allergies: topAllergies
      };
    } catch (error) {
      logger.error('Error getting pet health analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private async getTotalCustomers(organizationId: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    return count || 0;
  }

  private async getTotalPets(organizationId: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);
    return count || 0;
  }

  private async getTotalAppointments(organizationId: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    return count || 0;
  }

  private async getTodayAppointments(organizationId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await this.supabaseService.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('appointment_date', `${today}T00:00:00.000Z`)
      .lte('appointment_date', `${today}T23:59:59.999Z`);
    return count || 0;
  }

  private async getRevenueByPeriod(organizationId: string, startDate: string): Promise<number> {
    const { data } = await this.supabaseService.supabase
      .from('appointments')
      .select('actual_cost, price')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('completed_at', startDate);

    return data?.reduce((sum, apt) => sum + (apt.actual_cost || apt.price || 0), 0) || 0;
  }

  private async getActiveConversations(organizationId: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    return count || 0;
  }

  private async getPendingAppointments(organizationId: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'confirmed']);
    return count || 0;
  }

  private async getCustomersByPeriod(organizationId: string, startDate: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startDate);
    return count || 0;
  }

  private async getAppointmentsByPeriod(organizationId: string, startDate: string): Promise<number> {
    const { count } = await this.supabaseService.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startDate);
    return count || 0;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculatePetAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const ageDiff = Date.now() - birth.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  private async getDailyRevenueTrend(organizationId: string, startDate: Date, endDate: Date) {
    const { data } = await this.supabaseService.supabase
      .from('appointments')
      .select('completed_at, actual_cost, price')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at');

    const dailyRevenue: Record<string, number> = {};
    data?.forEach(apt => {
      const date = apt.completed_at.split('T')[0];
      const revenue = apt.actual_cost || apt.price || 0;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    });

    return Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getTopCustomersByRevenue(organizationId: string, startDate: Date, endDate: Date) {
    const { data } = await this.supabaseService.supabase
      .from('appointments')
      .select(`
        customer_id,
        actual_cost,
        price,
        customers (name, email)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    const customerRevenue: Record<string, { name: string; email?: string; revenue: number }> = {};

    data?.forEach(apt => {
      const revenue = apt.actual_cost || apt.price || 0;
      if (!customerRevenue[apt.customer_id]) {
        customerRevenue[apt.customer_id] = {
          name: (apt.customers as any)?.name || 'Unknown',
          email: (apt.customers as any)?.email,
          revenue: 0
        };
      }
      customerRevenue[apt.customer_id].revenue += revenue;
    });

    return Object.entries(customerRevenue)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([id, data]) => ({ customer_id: id, ...data }));
  }

  private async getCustomerAcquisition(organizationId: string) {
    const { data } = await this.supabaseService.supabase
      .from('customers')
      .select('created_at')
      .eq('organization_id', organizationId)
      .order('created_at');

    const monthlyAcquisition: Record<string, number> = {};
    data?.forEach(customer => {
      const month = customer.created_at.substring(0, 7); // YYYY-MM
      monthlyAcquisition[month] = (monthlyAcquisition[month] || 0) + 1;
    });

    return Object.entries(monthlyAcquisition)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getCustomerValueAnalysis(organizationId: string) {
    const { data } = await this.supabaseService.supabase
      .from('appointments')
      .select('customer_id, actual_cost, price')
      .eq('organization_id', organizationId)
      .eq('status', 'completed');

    const customerSpending: Record<string, number> = {};
    data?.forEach(apt => {
      const amount = apt.actual_cost || apt.price || 0;
      customerSpending[apt.customer_id] = (customerSpending[apt.customer_id] || 0) + amount;
    });

    const spendingValues = Object.values(customerSpending);
    const avgSpending = spendingValues.length > 0 ?
      spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length : 0;

    const maxSpending = Math.max(...spendingValues, 0);
    const minSpending = Math.min(...spendingValues, 0);

    return {
      average_customer_value: avgSpending,
      highest_customer_value: maxSpending,
      lowest_customer_value: minSpending,
      total_customers_with_purchases: spendingValues.length
    };
  }

  private async getCustomerRetention(organizationId: string) {
    // Get customers who made appointments in the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: recentCustomers } = await this.supabaseService.supabase
      .from('appointments')
      .select('customer_id, appointment_date')
      .eq('organization_id', organizationId)
      .gte('appointment_date', ninetyDaysAgo.toISOString());

    const customerLastVisit: Record<string, string> = {};
    recentCustomers?.forEach(apt => {
      if (!customerLastVisit[apt.customer_id] ||
          customerLastVisit[apt.customer_id] < apt.appointment_date) {
        customerLastVisit[apt.customer_id] = apt.appointment_date;
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = Object.values(customerLastVisit)
      .filter(lastVisit => new Date(lastVisit) >= thirtyDaysAgo).length;

    const totalCustomers = Object.keys(customerLastVisit).length;
    const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

    return {
      retention_rate_30_days: retentionRate,
      active_customers: activeCustomers,
      total_recent_customers: totalCustomers
    };
  }
}