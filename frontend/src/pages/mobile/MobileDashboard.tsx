import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMobileGestures } from '@/hooks/mobile/useMobileGestures';
import { useBreakpoint } from '@/components/ui/responsive-grid';
import {
  Heart,
  MessageCircle,
  Calendar,
  TrendingUp,
  Users,
  Bell,
  Star,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  activePets: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingMessages: number;
  satisfactionRate: number;
  trendsData: {
    label: string;
    value: number;
    change: number;
  }[];
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  path: string;
  badge?: number;
}

const quickActions: QuickAction[] = [
  {
    id: 'new-appointment',
    title: 'Novo Agendamento',
    icon: Calendar,
    color: 'bg-blue-500',
    path: '/appointments/new'
  },
  {
    id: 'messages',
    title: 'Mensagens',
    icon: MessageCircle,
    color: 'bg-green-500',
    path: '/conversations',
    badge: 5
  },
  {
    id: 'new-customer',
    title: 'Novo Cliente',
    icon: Users,
    color: 'bg-purple-500',
    path: '/customers/new'
  },
  {
    id: 'ai-assistant',
    title: 'IA Assistente',
    icon: Star,
    color: 'bg-orange-500',
    path: '/ai-config'
  }
];

export default function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCard, setActiveCard] = useState<number>(0);
  const { isMobile } = useBreakpoint();

  // Swipe gestures for card navigation
  const swipeGestures = useMobileGestures(
    () => setActiveCard(prev => Math.min(prev + 1, 2)), // swipe left - next card
    () => setActiveCard(prev => Math.max(prev - 1, 0)), // swipe right - prev card
  );

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      // Simulated API call - replace with real data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStats({
        totalCustomers: 248,
        activePets: 312,
        todayAppointments: 8,
        monthlyRevenue: 15420,
        pendingMessages: 5,
        satisfactionRate: 94,
        trendsData: [
          { label: 'Novos clientes', value: 12, change: 15 },
          { label: 'Agendamentos', value: 45, change: 8 },
          { label: 'Satisfação', value: 94, change: 3 }
        ]
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Stats cards data
  const getStatsCards = () => {
    if (!stats) return [];

    return [
      {
        title: 'Visão Geral',
        cards: [
          {
            title: 'Clientes Ativos',
            value: stats.totalCustomers,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: 'Total de famílias cadastradas'
          },
          {
            title: 'Pets Cuidados',
            value: stats.activePets,
            icon: Heart,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            description: 'Animais sob nossos cuidados'
          }
        ]
      },
      {
        title: 'Hoje',
        cards: [
          {
            title: 'Agendamentos',
            value: stats.todayAppointments,
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            description: 'Consultas programadas hoje'
          },
          {
            title: 'Mensagens',
            value: stats.pendingMessages,
            icon: MessageCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: 'Mensagens não respondidas',
            badge: stats.pendingMessages > 0 ? 'urgente' : undefined
          }
        ]
      },
      {
        title: 'Performance',
        cards: [
          {
            title: 'Receita Mensal',
            value: `R$ ${stats.monthlyRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            description: 'Faturamento deste mês'
          },
          {
            title: 'Satisfação',
            value: `${stats.satisfactionRate}%`,
            icon: Star,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            description: 'Índice de satisfação'
          }
        ]
      }
    ];
  };

  const statsCards = getStatsCards();

  if (!isMobile) {
    // Redirect to desktop version or render desktop layout
    return <div>Please use the desktop version on larger screens</div>;
  }

  return (
    <MobileLayout
      headerTitle="Central do Amor 💖"
      showHeader={true}
      showTabBar={true}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-4 text-4xl">🐾</div>
            <div className="absolute bottom-2 right-4 text-3xl">❤️</div>
            <div className="absolute top-1/2 right-8 text-2xl">🐕</div>
          </div>

          <div className="relative">
            <h1 className="text-xl font-bold mb-2">
              Bom dia! 🌅
            </h1>
            <p className="text-blue-100 mb-4">
              Hoje você tem {stats?.todayAppointments || 0} consultas agendadas
            </p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Sistema ativo</span>
              </div>
              {stats?.pendingMessages > 0 && (
                <Badge variant="destructive" className="bg-white/20 hover:bg-white/30">
                  {stats.pendingMessages} mensagens
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold flex items-center">
            <span>Ações Rápidas</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="h-20 w-full flex-col space-y-2 relative border-2 hover:border-blue-300 transition-all"
                    onClick={() => {
                      // Navigate to action path
                      window.location.href = action.path;
                    }}
                  >
                    <div className={`h-8 w-8 rounded-full ${action.color} flex items-center justify-center text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {action.title}
                    </span>

                    {action.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Cards - Swipeable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Estatísticas</h2>
            <div className="flex space-x-1">
              {statsCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCard(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    activeCard === index ? 'bg-blue-500 w-4' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            ref={swipeGestures.elementRef}
            className="overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {stats ? (
                <motion.div
                  key={activeCard}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-medium text-gray-600 px-1">
                    {statsCards[activeCard]?.title}
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {statsCards[activeCard]?.cards.map((card, index) => {
                      const IconComponent = card.icon;
                      return (
                        <Card key={index} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`h-10 w-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
                                  <IconComponent className={`h-5 w-5 ${card.color}`} />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">{card.title}</p>
                                  <p className="text-xl font-bold">{card.value}</p>
                                </div>
                              </div>

                              {card.badge && (
                                <Badge variant="destructive">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {card.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Atividades Recentes</h2>
            <Button variant="ghost" size="sm" className="text-sm">
              Ver todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {[
              {
                type: 'appointment',
                title: 'Consulta com Max',
                description: 'Agendada para hoje às 14:30',
                time: '2h atrás',
                icon: Calendar,
                color: 'text-blue-600'
              },
              {
                type: 'message',
                title: 'Nova mensagem de Maria Silva',
                description: 'Sobre a medicação da Lola',
                time: '4h atrás',
                icon: MessageCircle,
                color: 'text-green-600'
              },
              {
                type: 'customer',
                title: 'Novo cliente cadastrado',
                description: 'João Santos e seu gato Felix',
                time: '6h atrás',
                icon: Users,
                color: 'text-purple-600'
              }
            ].map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <IconComponent className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {activity.time}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom Padding for Tab Bar */}
        <div className="h-4" />
      </div>
    </MobileLayout>
  );
}