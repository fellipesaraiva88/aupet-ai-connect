import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  useTokenMetrics,
  useTokenUsageByOrganization,
  useTokenTrends,
  useTopTokenConsumers
} from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  TrendingUp,
  DollarSign,
  Zap,
  Award,
  BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminTokens: React.FC = () => {
  const { data: tokenMetrics, isLoading: loadingMetrics } = useTokenMetrics();
  const { data: topOrgs } = useTopTokenConsumers(10, 'organization');
  const { data: trends } = useTokenTrends(30);
  const { data: tokensByOrg } = useTokenUsageByOrganization({ limit: 50 });

  if (loadingMetrics) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const mainStats = [
    {
      title: 'Total de Tokens',
      value: tokenMetrics?.total_tokens?.toLocaleString() || '0',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: `${tokenMetrics?.tokens_last_7_days?.toLocaleString() || 0} (7d)`
    },
    {
      title: 'Custo Total',
      value: `$${tokenMetrics?.total_estimated_cost_usd?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: `$${tokenMetrics?.cost_last_7_days?.toFixed(2) || '0.00'} (7d)`
    },
    {
      title: 'Requisições',
      value: tokenMetrics?.total_requests?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: `${tokenMetrics?.avg_tokens_per_request?.toFixed(0) || 0} tokens/req`
    },
    {
      title: 'Custo Médio/Req',
      value: `$${(
        (tokenMetrics?.total_estimated_cost_usd || 0) /
        (tokenMetrics?.total_requests || 1)
      ).toFixed(4)}`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: 'Média geral'
    }
  ];

  // Prepare chart data
  const chartData =
    trends?.map((trend) => ({
      date: format(new Date(trend.date), 'dd/MM', { locale: ptBR }),
      tokens: trend.total_tokens,
      cost: trend.total_cost,
      requests: trend.requests
    })) || [];

  // Prepare model usage data for bar chart
  const modelData =
    tokenMetrics?.usage_by_model &&
    Object.entries(tokenMetrics.usage_by_model).map(([model, data]: [string, any]) => ({
      model: model.replace('gpt-', 'GPT-'),
      tokens: data.tokens,
      cost: data.cost,
      requests: data.requests
    }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Coins className="text-yellow-600" size={32} />
            Tokenômetro
          </h1>
          <p className="text-slate-600 mt-2">
            Monitoramento completo de uso de tokens OpenAI
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => {
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
                      <p className="text-2xl font-bold text-slate-900 mb-2">
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

        {/* Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="ranking">Top Consumidores</TabsTrigger>
            <TabsTrigger value="models">Por Modelo</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso de Tokens (Últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tokens"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Tokens"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custo Diário (USD)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Custo (USD)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Organizações (30 dias)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Requisições</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topOrgs?.map((org: any, index: number) => (
                      <TableRow key={org.organization_id}>
                        <TableCell>
                          <Badge
                            variant={index < 3 ? 'default' : 'secondary'}
                            className={
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                ? 'bg-slate-400'
                                : index === 2
                                ? 'bg-orange-600'
                                : ''
                            }
                          >
                            {index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {org.organization_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.subscription_tier}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {org.total_tokens?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${org.total_estimated_cost_usd?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {org.total_requests?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {(!topOrgs || topOrgs.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso por Modelo</CardTitle>
              </CardHeader>
              <CardContent>
                {modelData && modelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tokens" fill="#3b82f6" name="Tokens" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-12">
                    Nenhum dado de modelos disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Modelo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Requisições</TableHead>
                      <TableHead className="text-right">Custo/Req</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelData?.map((model: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{model.model}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {model.tokens?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${model.cost?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {model.requests?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          ${(model.cost / model.requests).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminTokens;