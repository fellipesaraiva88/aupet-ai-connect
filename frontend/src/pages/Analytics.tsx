import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AppleCard, AppleStatsGrid } from "@/components/ui/apple-card";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  MessageSquare,
  Download,
  Filter,
} from "lucide-react";

const monthlyData = [
  { name: "Jan", receita: 12000, clientes: 45, agendamentos: 120 },
  { name: "Fev", receita: 15000, clientes: 52, agendamentos: 140 },
  { name: "Mar", receita: 18000, clientes: 61, agendamentos: 165 },
  { name: "Abr", receita: 16000, clientes: 58, agendamentos: 155 },
  { name: "Mai", receita: 22000, clientes: 72, agendamentos: 180 },
  { name: "Jun", receita: 25000, clientes: 78, agendamentos: 195 },
  { name: "Jul", receita: 28000, clientes: 85, agendamentos: 210 },
  { name: "Ago", receita: 26000, clientes: 82, agendamentos: 200 },
  { name: "Set", receita: 30000, clientes: 95, agendamentos: 225 },
];

const servicesData = [
  { name: "Banho e Tosa", value: 45, color: "#1E62EC" },
  { name: "Consulta Vet", value: 25, color: "#FFDE59" },
  { name: "Vacinação", value: 15, color: "#34D399" },
  { name: "Hospedagem", value: 10, color: "#F59E0B" },
  { name: "Outros", value: 5, color: "#6B7280" },
];

const conversationData = [
  { name: "Dom", automaticas: 45, humanas: 12 },
  { name: "Seg", automaticas: 52, humanas: 18 },
  { name: "Ter", automaticas: 48, humanas: 15 },
  { name: "Qua", automaticas: 61, humanas: 22 },
  { name: "Qui", automaticas: 55, humanas: 19 },
  { name: "Sex", automaticas: 67, humanas: 25 },
  { name: "Sab", automaticas: 58, humanas: 20 },
];

const Analytics = () => {
  const activeMenuItem = useActiveNavigation();
  const [timeFilter, setTimeFilter] = useState("month");

  const stats = {
    revenue: {
      value: 30000,
      change: 15.2,
      trend: "up" as const,
    },
    customers: {
      value: 95,
      change: 8.1,
      trend: "up" as const,
    },
    appointments: {
      value: 225,
      change: 12.5,
      trend: "up" as const,
    },
    automation: {
      value: 87.5,
      change: -2.3,
      trend: "down" as const,
    },
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") {
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-success" : "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Modern Analytics Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
                <p className="text-muted-foreground">
                  Acompanhe o desempenho e crescimento do seu negócio
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="quarter">Último trimestre</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>

                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <AppleStatsGrid>
              <AppleCard
                title="Receita Total"
                value={`R$ ${stats.revenue.value.toLocaleString('pt-BR')}`}
                subtitle="Faturamento mensal"
                icon={DollarSign}
                trend={{
                  value: `${stats.revenue.change > 0 ? '+' : ''}${stats.revenue.change}%`,
                  isPositive: stats.revenue.trend === 'up'
                }}
                variant="default"
              />
              <AppleCard
                title="Novos Clientes"
                value={stats.customers.value}
                subtitle="Famílias cadastradas"
                icon={Users}
                trend={{
                  value: `${stats.customers.change > 0 ? '+' : ''}${stats.customers.change}%`,
                  isPositive: stats.customers.trend === 'up'
                }}
                variant="gradient"
              />
              <AppleCard
                title="Agendamentos"
                value={stats.appointments.value}
                subtitle="Consultas marcadas"
                icon={Calendar}
                trend={{
                  value: `${stats.appointments.change > 0 ? '+' : ''}${stats.appointments.change}%`,
                  isPositive: stats.appointments.trend === 'up'
                }}
                variant="elevated"
              />
              <AppleCard
                title="Automação IA"
                value={`${stats.automation.value}%`}
                subtitle="Eficiência do sistema"
                icon={MessageSquare}
                trend={{
                  value: `${stats.automation.change > 0 ? '+' : ''}${stats.automation.change}%`,
                  isPositive: stats.automation.trend === 'up'
                }}
                variant="default"
              />
            </AppleStatsGrid>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Chart */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                  <CardDescription>
                    Evolução da receita ao longo dos meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="receita"
                        stroke="#1E62EC"
                        strokeWidth={3}
                        dot={{ fill: "#1E62EC", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Services Distribution */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>Distribuição de Serviços</CardTitle>
                  <CardDescription>
                    Percentual de cada serviço no total de agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={servicesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {servicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Appointments Chart */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>Agendamentos por Mês</CardTitle>
                  <CardDescription>
                    Número total de agendamentos mensais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="agendamentos" fill="#FFDE59" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Automation Performance */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>Performance da Automação</CardTitle>
                  <CardDescription>
                    Comparação entre atendimentos automáticos e humanos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="automaticas" stackId="a" fill="#1E62EC" name="Automáticas" />
                      <Bar dataKey="humanas" stackId="a" fill="#FFDE59" name="Humanas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-center">Eficiência da IA</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold font-secondary text-primary mb-2">
                    {stats.automation.value}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Das conversas são resolvidas automaticamente
                  </p>
                  <Badge className="mt-4 bg-success text-white">
                    Excelente Performance
                  </Badge>
                </CardContent>
              </Card>

              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-center">Tempo Médio de Resposta</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold font-secondary text-primary mb-2">
                    1.2s
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tempo médio para primeira resposta
                  </p>
                  <Badge className="mt-4 bg-secondary text-secondary-foreground">
                    Nunca Perde Cliente
                  </Badge>
                </CardContent>
              </Card>

              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-center">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold font-secondary text-primary mb-2">
                    68%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    De conversas resultam em agendamento
                  </p>
                  <Badge className="mt-4 bg-warning text-warning-foreground">
                    Alta Conversão
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;