import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AppleCard, AppleStatsGrid } from "@/components/ui/apple-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useOrganizationId } from "@/hooks/useApiData";
import { useRealTimeSubscriptions } from "@/hooks/useRealTime";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { MessageSquare, Calendar, TrendingUp, Users, Bot, Heart, Sparkles, Clock, Phone } from "lucide-react";

const Index = () => {
  const activeMenuItem = useActiveNavigation();
  const organizationId = useOrganizationId();
  const { data: dashboardStats, isLoading, error } = useDashboardStats(organizationId);
  const navigate = useNavigate();

  // Set up real-time subscriptions for live dashboard updates
  useRealTimeSubscriptions(organizationId);
  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Dashboard Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
            {/* Modern Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Visão geral do seu negócio de cuidados para pets
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={() => navigate('/analytics')} className="flex-1 sm:flex-none">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
                <Button onClick={() => navigate('/conversations')} className="flex-1 sm:flex-none">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver </span>Conversas
                </Button>
              </div>
            </div>

            {/* Apple Stats Grid */}
            <AppleStatsGrid>
              <AppleCard
                title="Conversas Hoje"
                value={dashboardStats?.conversations_today || 0}
                subtitle="Famílias atendidas"
                icon={MessageSquare}
                trend={{
                  value: "+12%",
                  isPositive: true
                }}
                variant="default"
              />
              <AppleCard
                title="Agendamentos"
                value={dashboardStats?.daily_appointments || 0}
                subtitle="Consultas marcadas"
                icon={Calendar}
                trend={{
                  value: "+8%",
                  isPositive: true
                }}
                variant="gradient"
              />
              <AppleCard
                title="Taxa de Resposta"
                value={`${dashboardStats?.response_rate_percent?.toFixed(1) || '87.5'}%`}
                subtitle="Eficiência da IA"
                icon={Bot}
                trend={{
                  value: "+5%",
                  isPositive: true
                }}
                variant="elevated"
              />
              <AppleCard
                title="Receita Hoje"
                value={`R$ ${dashboardStats?.daily_revenue?.toLocaleString('pt-BR') || '1.240'}`}
                subtitle="Faturamento"
                icon={TrendingUp}
                trend={{
                  value: "+15%",
                  isPositive: true
                }}
                variant="default"
              />
            </AppleStatsGrid>

            {/* Quick Actions Apple-style */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-[20px] bg-white/90 backdrop-blur-sm border-border/30 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription className="text-[13px] text-muted-foreground tracking-[-0.005em]">
                    Acesse rapidamente as principais funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5 hover:bg-primary/6 hover:border-primary/20 transition-all duration-200 rounded-[12px] border-border/30"
                    onClick={() => navigate('/conversations')}
                  >
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Conversas</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5 hover:bg-primary/6 hover:border-primary/20 transition-all duration-200 rounded-[12px] border-border/30"
                    onClick={() => navigate('/appointments')}
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Agendamentos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5 hover:bg-primary/6 hover:border-primary/20 transition-all duration-200 rounded-[12px] border-border/30"
                    onClick={() => navigate('/customers')}
                  >
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Clientes</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5 hover:bg-primary/6 hover:border-primary/20 transition-all duration-200 rounded-[12px] border-border/30"
                    onClick={() => navigate('/pets')}
                  >
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Pets</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[20px] bg-white/90 backdrop-blur-sm border-border/30 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                    <Clock className="h-4 w-4 text-primary" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription className="text-[13px] text-muted-foreground tracking-[-0.005em]">
                    Últimas atividades do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="h-7 w-7 rounded-[8px] bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium tracking-[-0.01em]">Nova conversa iniciada</p>
                          <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 2 minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="h-7 w-7 rounded-[8px] bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium tracking-[-0.01em]">Agendamento confirmado</p>
                          <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 5 minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="h-7 w-7 rounded-[8px] bg-success/10 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-success" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium tracking-[-0.01em]">Novo cliente cadastrado</p>
                          <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 10 minutos</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>;
};
export default Index;