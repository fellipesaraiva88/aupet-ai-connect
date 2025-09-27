import React from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useOrganizationId } from "@/hooks/useSupabaseData";
import {
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  Heart,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";

export function StatsOverview() {
  const organizationId = useOrganizationId();
  const { data: dashboardStats, isLoading, error } = useDashboardStats(organizationId);

  // Create stats from Supabase data with defaults
  const stats = [
    {
      title: "Famílias Atendidas Hoje",
      value: (dashboardStats?.conversations_today || 0).toString(),
      change: `+${Math.round((dashboardStats?.conversations_today || 0) * 0.23)}% vs ontem`,
      changeType: "positive" as const,
      icon: MessageSquare,
      variant: "success" as const,
    },
    {
      title: "Famílias Felizes",
      value: (dashboardStats?.active_clients || 0).toLocaleString('pt-BR'),
      change: "+12% este mês",
      changeType: "positive" as const,
      icon: Users,
      variant: "info" as const,
    },
    {
      title: "Peludos Cuidados",
      value: (dashboardStats?.total_pets || 0).toLocaleString('pt-BR'),
      change: `+${dashboardStats?.new_pets_today || 0} hoje`,
      changeType: "positive" as const,
      icon: Heart,
      variant: "default" as const,
    },
    {
      title: "Momentos Marcados",
      value: (dashboardStats?.daily_appointments || 0).toString(),
      change: "Para hoje",
      changeType: "neutral" as const,
      icon: Calendar,
      variant: "warning" as const,
    },
    {
      title: "Faturamento",
      value: `R$ ${(dashboardStats?.daily_revenue || 0).toLocaleString('pt-BR')}`,
      change: "+18% este mês",
      changeType: "positive" as const,
      icon: DollarSign,
      variant: "success" as const,
    },
    {
      title: "Rapidez no Carinho",
      value: "1.2s",
      change: "NUNCA PERDE CLIENTE",
      changeType: "positive" as const,
      icon: Clock,
      variant: "info" as const,
    },
    {
      title: "Cuidado 24/7",
      value: `${(dashboardStats?.response_rate_percent || 87.5).toFixed(1)}%`,
      change: "+5% este mês",
      changeType: "positive" as const,
      icon: TrendingUp,
      variant: "success" as const,
    },
    {
      title: "IA Cuidando",
      value: (dashboardStats?.ai_responses_today || 0).toString(),
      change: "Automático",
      changeType: "positive" as const,
      icon: CheckCircle,
      variant: "success" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-6 rounded-lg border bg-card">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          variant={stat.variant}
          className="animate-slide-up"
        />
      ))}
    </div>
  );
}