import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStats, useDashboardActivity, useSystemHealth } from '@/hooks/useDashboardStats';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  href?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, href }: StatCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => href && navigate(href)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  entity: string;
  time: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const severityIcons = {
  info: Activity,
  warning: AlertTriangle,
  error: AlertTriangle,
  success: CheckCircle
};

const severityColors = {
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  success: 'text-green-600'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useDashboardActivity();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema e atividades recentes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <div className="col-span-4 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StatCard
              title="Total de Usuários"
              value={stats?.totalUsers || 0}
              description="Ativos no sistema"
              icon={Users}
              trend={stats?.userGrowthPercent ? {
                value: `${stats.userGrowthPercent > 0 ? '+' : ''}${stats.userGrowthPercent}%`,
                isPositive: stats.userGrowthPercent > 0
              } : undefined}
              href="/admin/users"
            />
            <StatCard
              title="Organizações"
              value={stats?.totalOrganizations || 0}
              description="Contas ativas"
              icon={Building2}
              trend={stats?.orgGrowthPercent ? {
                value: `${stats.orgGrowthPercent > 0 ? '+' : ''}${stats.orgGrowthPercent}%`,
                isPositive: stats.orgGrowthPercent > 0
              } : undefined}
              href="/admin/organizations"
            />
            <StatCard
              title="Eventos de Auditoria"
              value={stats?.auditLogsLast7Days || 0}
              description="Últimos 7 dias"
              icon={Activity}
              href="/admin/audit"
            />
            <StatCard
              title="Roles Ativos"
              value={stats?.totalRoles || 0}
              description="Configurações de acesso"
              icon={Shield}
              href="/admin/roles"
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações realizadas no sistema</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/audit')}
              >
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const SeverityIcon = severityIcons[activity.severity];
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center bg-muted',
                        severityColors[activity.severity]
                      )}>
                        <SeverityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">{activity.user}</span>
                          {' '}{activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.entity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade recente
              </p>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>Saúde do Sistema</CardTitle>
            <CardDescription>Status dos serviços principais</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : health && health.services ? (
              <div className="space-y-4">
                {health.services.map((service: any) => {
                  const isHealthy = service.status === 'healthy';
                  const isWarning = service.status === 'warning';
                  const isError = service.status === 'error';

                  const bgColor = isHealthy ? 'bg-green-50 border-green-200' :
                                  isWarning ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-red-50 border-red-200';
                  const textColor = isHealthy ? 'text-green-900' :
                                   isWarning ? 'text-yellow-900' :
                                   'text-red-900';
                  const iconColor = isHealthy ? 'text-green-600' :
                                   isWarning ? 'text-yellow-600' :
                                   'text-red-600';
                  const badgeColor = isHealthy ? 'bg-green-600' :
                                     isWarning ? 'border-yellow-600 text-yellow-600' :
                                     'bg-red-600';

                  return (
                    <div key={service.name} className={cn('flex items-center justify-between p-3 rounded-lg border', bgColor)}>
                      <div className="flex items-center gap-3">
                        {isHealthy ? (
                          <CheckCircle className={cn('h-5 w-5', iconColor)} />
                        ) : (
                          <AlertTriangle className={cn('h-5 w-5', iconColor)} />
                        )}
                        <div>
                          <p className={cn('font-medium', textColor)}>{service.name}</p>
                          <p className={cn('text-sm', iconColor)}>{service.message}</p>
                        </div>
                      </div>
                      <Badge
                        variant={isWarning ? 'outline' : 'default'}
                        className={badgeColor}
                      >
                        {service.responseTime ? `${service.responseTime}ms` : service.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Não foi possível carregar informações de saúde
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às tarefas administrativas comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Gerenciar Usuários</p>
                <p className="text-xs text-muted-foreground">Criar, editar ou desativar</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/admin/organizations')}
            >
              <Building2 className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Nova Organização</p>
                <p className="text-xs text-muted-foreground">Cadastrar nova conta</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/admin/audit')}
            >
              <Activity className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Ver Logs</p>
                <p className="text-xs text-muted-foreground">Auditoria completa</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
