import React from "react";
import { MetricCard } from "@/components/ui/metric-card";
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
  const stats = [
    {
      title: "Conversas Hoje",
      value: "142",
      change: "+23% vs ontem",
      changeType: "positive" as const,
      icon: MessageSquare,
      variant: "success" as const,
    },
    {
      title: "Clientes Ativos",
      value: "1,234",
      change: "+12% este mês",
      changeType: "positive" as const,
      icon: Users,
      variant: "info" as const,
    },
    {
      title: "Pets Cadastrados",
      value: "1,876",
      change: "+8% este mês",
      changeType: "positive" as const,
      icon: Heart,
      variant: "default" as const,
    },
    {
      title: "Agendamentos",
      value: "34",
      change: "Para hoje",
      changeType: "neutral" as const,
      icon: Calendar,
      variant: "warning" as const,
    },
    {
      title: "Faturamento",
      value: "R$ 12.450",
      change: "+18% este mês",
      changeType: "positive" as const,
      icon: DollarSign,
      variant: "success" as const,
    },
    {
      title: "Tempo Resposta",
      value: "2m 30s",
      change: "-15% vs média",
      changeType: "positive" as const,
      icon: Clock,
      variant: "info" as const,
    },
    {
      title: "Taxa Conversão",
      value: "87%",
      change: "+5% este mês",
      changeType: "positive" as const,
      icon: TrendingUp,
      variant: "success" as const,
    },
    {
      title: "Satisfação",
      value: "4.8/5.0",
      change: "Excelente",
      changeType: "positive" as const,
      icon: CheckCircle,
      variant: "success" as const,
    },
  ];

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