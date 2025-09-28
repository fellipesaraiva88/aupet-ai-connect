import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AppleCard, AppleStatsGrid } from "@/components/ui/apple-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingButton } from "@/components/ui/loading-button";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { FeedbackButton, CounterAnimation, PulseIndicator } from "@/components/ui/micro-interactions";
import { useLoading } from "@/contexts/LoadingContext";
import { useGlobalToast } from "@/hooks/useEnhancedToast";
import { useDashboardStats, useOrganizationId } from "@/hooks/useApiData";
import { useRealTimeSubscriptions } from "@/hooks/useRealTime";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { MessageSquare, Calendar, TrendingUp, Users, Bot, Heart, Sparkles, Clock, Phone } from "lucide-react";

const Index = () => {
  const activeMenuItem = useActiveNavigation();
  const organizationId = useOrganizationId();
  const { data: dashboardStats, isLoading, error } = useDashboardStats(organizationId);
  const { setLoading } = useLoading();
  const toast = useGlobalToast();
  const navigate = useNavigate();

  // Set up real-time subscriptions for live dashboard updates
  useRealTimeSubscriptions(organizationId);

  const handleNavigateWithLoading = (path: string, message: string) => {
    setLoading('navigation', true);
    toast.info('Navegando...', message);

    setTimeout(() => {
      navigate(path);
      setLoading('navigation', false);
    }, 500);
  };
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
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Central do Cuidado Pet 🐾</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Acompanhe todo o carinho que você espalha cuidando de cãezinhos, gatinhos e todos os peludos especiais
                </p>
                <p className="text-xs text-primary/70 mt-1 italic">
                  "Curiosidade: Cães podem detectar doenças através do olfato - por isso o cuidado preventivo é tão importante!"
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <LoadingButton
                  variant="outline"
                  onClick={() => handleNavigateWithLoading('/analytics', 'Carregando insights especiais...')}
                  icon={<TrendingUp className="h-4 w-4" />}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Insights do Cuidado 📊</span>
                </LoadingButton>
                <FeedbackButton
                  variant="info"
                  onClick={() => handleNavigateWithLoading('/conversations', 'Carregando conversas cheias de amor...')}
                  className="flex-1 sm:flex-none"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Ver </span>Conversas com Tutores
                  </div>
                </FeedbackButton>
              </div>
            </div>

            {/* Apple Stats Grid */}
            <AppleStatsGrid>
              <AppleCard
                title="Tutores Atendidos Hoje"
                value={dashboardStats?.conversations_today || 0}
                subtitle="Famílias de pets acolhidas"
                icon={MessageSquare}
                trend={{
                  value: "+12%",
                  isPositive: true
                }}
                variant="default"
              />
              <AppleCard
                title="Consultas Agendadas"
                value={dashboardStats?.daily_appointments || 0}
                subtitle="Cuidados para cães e gatos"
                icon={Calendar}
                trend={{
                  value: "+8%",
                  isPositive: true
                }}
                variant="gradient"
              />
              <AppleCard
                title="Assistente IA Especializada"
                value={`${dashboardStats?.response_rate_percent?.toFixed(1) || '87.5'}%`}
                subtitle="Respostas inteligentes sobre pets"
                icon={Bot}
                trend={{
                  value: "+5%",
                  isPositive: true
                }}
                variant="elevated"
              />
              <AppleCard
                title="Faturamento do Dia"
                value={`R$ ${dashboardStats?.daily_revenue?.toLocaleString('pt-BR') || '1.240'}`}
                subtitle="Cuidando bem, crescendo sempre"
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
              <Card className="rounded-[20px] bg-card border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Acesso Rápido para o Cuidado
                  </CardTitle>
                  <CardDescription className="text-[13px] text-muted-foreground tracking-[-0.005em]">
                    Tudo que você precisa para cuidar dos peludos com excelência
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
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Tutores</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5 hover:bg-primary/6 hover:border-primary/20 transition-all duration-200 rounded-[12px] border-border/30"
                    onClick={() => navigate('/pets')}
                  >
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">Pets 🐾</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[20px] bg-card border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                    <Clock className="h-4 w-4 text-primary" />
                    Atividades Recentes
                  </CardTitle>
                  <CardDescription className="text-[13px] text-muted-foreground tracking-[-0.005em]">
                    Acompanhe os últimos cuidados realizados
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
                      <div className="flex items-center justify-between p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-[8px] bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium tracking-[-0.01em]">Tutores atendidos com carinho</p>
                            <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 2 minutos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-primary font-bold">
                            <CounterAnimation value={dashboardStats?.conversations_today || 0} />
                          </Badge>
                          <PulseIndicator size="sm" color="bg-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="h-7 w-7 rounded-[8px] bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium tracking-[-0.01em]">Consulta veterinária agendada</p>
                          <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 5 minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-secondary/30 transition-colors duration-200">
                        <div className="h-7 w-7 rounded-[8px] bg-success/10 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-success" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-medium tracking-[-0.01em]">IA respondendo sobre comportamento felino</p>
                            <p className="text-[11px] text-muted-foreground tracking-[-0.005em]">há 10 minutos</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="text-success font-bold">
                              {dashboardStats?.response_rate_percent
                                ? `${dashboardStats.response_rate_percent.toFixed(1)}%`
                                : '87.5%'}
                            </Badge>
                            <EnhancedProgress
                              value={dashboardStats?.response_rate_percent || 87.5}
                              max={100}
                              size="sm"
                              variant="success"
                              className="w-16"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Seção de Motivação e Curiosidades */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-[20px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Frase do Dia</h3>
                  <p className="text-sm text-blue-700 italic">
                    "O amor de um pet é a terapia mais pura que existe. Cada latido, miado ou ronronar traz cura para a alma."
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[20px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">Curiosidade Pet</h3>
                  <p className="text-sm text-green-700">
                    <strong>Você sabia?</strong> Gatos dormem entre 12-16 horas por dia para conservar energia para a caça, mesmo sendo domésticos!
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[20px] bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-900 mb-2">Dica de Saúde</h3>
                  <p className="text-sm text-purple-700">
                    <strong>Lembre-se:</strong> Check-ups regulares são essenciais! Cães e gatos devem visitar o veterinário pelo menos uma vez ao ano.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>;
};
export default Index;