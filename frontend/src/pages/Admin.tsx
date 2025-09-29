import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSystemMetrics, useTokenMetrics } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Zap,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Admin: React.FC = () => {
  const { data: systemMetrics, isLoading: loadingSystem } = useSystemMetrics();
  const { data: tokenMetrics, isLoading: loadingTokens } = useTokenMetrics();

  const stats = [
    {
      title: 'Organizações Ativas',
      value: systemMetrics?.active_organizations || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: `${systemMetrics?.new_orgs_last_7_days || 0} novos (7d)`
    },
    {
      title: 'Total de Usuários',
      value: systemMetrics?.total_active_users || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: `${systemMetrics?.new_users_last_7_days || 0} novos (7d)`
    },
    {
      title: 'Mensagens Processadas',
      value: systemMetrics?.total_messages?.toLocaleString() || 0,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: `${systemMetrics?.messages_last_7_days?.toLocaleString() || 0} (7d)`
    },
    {
      title: 'Tokens Usados (30d)',
      value: tokenMetrics?.tokens_last_30_days?.toLocaleString() || 0,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: `${tokenMetrics?.tokens_last_7_days?.toLocaleString() || 0} (7d)`
    },
    {
      title: 'Custo Estimado (30d)',
      value: `$${tokenMetrics?.cost_last_30_days?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: `$${tokenMetrics?.cost_last_7_days?.toFixed(2) || '0.00'} (7d)`
    },
    {
      title: 'Agendamentos',
      value: systemMetrics?.total_appointments?.toLocaleString() || 0,
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      trend: 'Total acumulado'
    }
  ];

  const tierStats = [
    {
      tier: 'Free',
      count: systemMetrics?.orgs_free_tier || 0,
      color: 'bg-slate-500'
    },
    {
      tier: 'Pro',
      count: systemMetrics?.orgs_pro_tier || 0,
      color: 'bg-blue-500'
    },
    {
      tier: 'Enterprise',
      count: systemMetrics?.orgs_enterprise_tier || 0,
      color: 'bg-purple-500'
    }
  ];

  if (loadingSystem || loadingTokens) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={32} />
            Dashboard Administrativo
          </h1>
          <p className="text-slate-600 mt-2">
            Visão geral do sistema Auzap.ai
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-slate-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600 mb-2">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp size={12} className="text-green-600" />
                        {stat.trend}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={stat.color} size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organizations by Tier */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Organizações por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tierStats.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${tier.color}`}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {tier.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-slate-900">
                        {tier.count}
                      </span>
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${tier.color}`}
                          style={{
                            width: `${
                              ((tier.count / (systemMetrics?.active_organizations || 1)) *
                                100) ||
                              0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Token Usage by Model */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Uso de Tokens por Modelo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenMetrics?.usage_by_model &&
                  Object.entries(tokenMetrics.usage_by_model).map(
                    ([model, data]: [string, any], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {model}
                          </span>
                          <p className="text-xs text-slate-500">
                            {data.requests} requisições
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">
                            {data.tokens?.toLocaleString()}
                          </span>
                          <p className="text-xs text-slate-500">
                            ${data.cost?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  )}

                {(!tokenMetrics?.usage_by_model ||
                  Object.keys(tokenMetrics.usage_by_model).length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum uso de tokens registrado ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Roles Distribution */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Distribuição de Usuários por Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-sm font-medium text-purple-700 mb-2">
                  Super Admins
                </p>
                <p className="text-4xl font-bold text-purple-900">
                  {systemMetrics?.super_admin_count || 0}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-sm font-medium text-blue-700 mb-2">Admins</p>
                <p className="text-4xl font-bold text-blue-900">
                  {systemMetrics?.admin_count || 0}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <p className="text-sm font-medium text-green-700 mb-2">
                  Usuários
                </p>
                <p className="text-4xl font-bold text-green-900">
                  {systemMetrics?.user_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-600 mb-1">WhatsApp Instances</p>
            <p className="text-2xl font-bold text-slate-900">
              {systemMetrics?.total_whatsapp_instances || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-600 mb-1">Conversas</p>
            <p className="text-2xl font-bold text-slate-900">
              {systemMetrics?.total_conversations?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-600 mb-1">Clientes</p>
            <p className="text-2xl font-bold text-slate-900">
              {systemMetrics?.total_customers?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-600 mb-1">Pets</p>
            <p className="text-2xl font-bold text-slate-900">
              {systemMetrics?.total_pets?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Admin;