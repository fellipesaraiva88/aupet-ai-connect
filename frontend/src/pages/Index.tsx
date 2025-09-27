import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { AIPerformance } from "@/components/dashboard/ai-performance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useOrganizationId } from "@/hooks/useSupabaseData";
import { useRealTimeSubscriptions } from "@/hooks/useRealTime";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Zap, MessageSquare, Calendar, TrendingUp, Users, ArrowRight, Play, Bot, Heart } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const Index = () => {
  const activeMenuItem = useActiveNavigation();
  const organizationId = useOrganizationId();
  const { data: dashboardStats, isLoading, error } = useDashboardStats(organizationId);
  const navigate = useNavigate();

  // Set up real-time subscriptions for live dashboard updates
  useRealTimeSubscriptions(organizationId);
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        
        {/* Content */}
        <div className="relative">
          <Navbar />
          
          
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex h-screen">
        <Sidebar activeItem={activeMenuItem} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary">Seu Pet Shop Conectado</h1>
                <p className="text-muted-foreground font-secondary">
                  Enquanto você cuida dos pets, nós cuidamos de nunca perder um cliente. Cada conversa, cada agendamento, cada oportunidade é nossa responsabilidade.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/analytics/history')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver histórico completo
                </Button>
                <Button
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  onClick={() => navigate('/analytics')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Como estou crescendo?
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Conversations - Takes 2 columns */}
              <RecentConversations />
              
              {/* AI Performance - Takes 1 column */}
              <AIPerformance />
            </div>

            {/* Additional Content */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Cuidar com Amor Agora
                  </CardTitle>
                  <CardDescription>
                    Transforme cada necessidade em carinho e cuidado especial
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => navigate('/conversations')}
                  >
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Falar com uma Família</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => navigate('/appointments/new')}
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Marcar Momento Especial</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => navigate('/customers/new')}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Acolher Nova Família</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => navigate('/pets/new')}
                  >
                    <Heart className="h-6 w-6" />
                    <span className="text-sm">Cadastrar Novo Peludo</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Real-time Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Hoje Fizemos a Diferença</CardTitle>
                  <CardDescription>
                    Acompanhe como cada momento se transforma em amor e cuidado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </>
                  ) : error ? (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">Erro ao carregar métricas</p>
                      <p className="text-xs">Usando dados de exemplo</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Famílias abraçadas hoje</span>
                        </div>
                        <Badge variant="secondary" className="text-primary font-bold">
                          {dashboardStats?.conversations_today || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium">Cuidados agendados</span>
                        </div>
                        <Badge variant="secondary" className="text-secondary font-bold">
                          {dashboardStats?.daily_appointments || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium">Proteção total</span>
                        </div>
                        <Badge variant="secondary" className="text-success font-bold">
                          {dashboardStats?.response_rate_percent
                            ? `${dashboardStats.response_rate_percent.toFixed(1)}%`
                            : '87.5%'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-warning" />
                          <span className="text-sm font-medium">Prosperidade hoje</span>
                        </div>
                        <Badge variant="secondary" className="text-warning font-bold font-secondary">
                          R$ {dashboardStats?.daily_revenue
                            ? dashboardStats.daily_revenue.toLocaleString('pt-BR')
                            : '1.240'}
                        </Badge>
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