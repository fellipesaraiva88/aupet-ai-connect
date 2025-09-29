import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, MessageSquare, AlertTriangle, Clock, Target } from 'lucide-react';

interface AIMetrics {
  totalMessages: number;
  opportunitiesDetected: number;
  responsesGenerated: number;
  escalated: number;
  errors: number;
  avgConfidence: number;
  avgProcessingTime: number;
  opportunityRate: number;
  escalationRate: number;
  pnlTechniques: Record<string, number>;
  urgencyDistribution: Record<string, number>;
}

export default function AIAnalytics() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const days = parseInt(timeRange);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await fetch(
        `/api/ai-metrics/metrics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Analytics de IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise completa de performance e decisões da IA
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === '7d' ? 'bg-primary text-white' : 'bg-secondary'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === '30d' ? 'bg-primary text-white' : 'bg-secondary'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === '90d' ? 'bg-primary text-white' : 'bg-secondary'
            }`}
          >
            90 dias
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Analisadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de resposta: {metrics?.totalMessages ? '100%' : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Detectadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.opportunitiesDetected || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa: {metrics?.opportunityRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgConfidence || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De 0.0 a 1.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgProcessingTime || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de processamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise Detalhada */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">Técnicas de PNL</TabsTrigger>
          <TabsTrigger value="urgency">Distribuição de Urgência</TabsTrigger>
          <TabsTrigger value="escalation">Escalações</TabsTrigger>
        </TabsList>

        {/* Análise de PNL */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance das Técnicas de PNL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.pnlTechniques && Object.entries(metrics.pnlTechniques).map(([technique, count]) => {
                  const total = Object.values(metrics.pnlTechniques).reduce((a, b) => a + b, 0);
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div key={technique} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {technique.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribuição de Urgência */}
        <TabsContent value="urgency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Urgência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.urgencyDistribution && Object.entries(metrics.urgencyDistribution).map(([urgency, count]) => {
                  const total = Object.values(metrics.urgencyDistribution).reduce((a, b) => a + b, 0);
                  const percentage = Math.round((count / total) * 100);

                  const urgencyColors: Record<string, string> = {
                    critical: 'bg-red-500',
                    high: 'bg-orange-500',
                    medium: 'bg-yellow-500',
                    low: 'bg-green-500'
                  };

                  return (
                    <div key={urgency} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize flex items-center gap-2">
                          {urgency === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {urgency}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${urgencyColors[urgency]} rounded-full h-2 transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise de Escalações */}
        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalações para Humano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Escalações</p>
                    <p className="text-3xl font-bold">{metrics?.escalated || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Taxa de Escalação</p>
                    <p className="text-3xl font-bold">{metrics?.escalationRate || 0}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Status da IA</p>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">
                      IA está operando normalmente
                    </span>
                  </div>
                  {metrics && metrics.escalationRate > 20 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Taxa de escalação acima do normal
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card de Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics && (
            <>
              {metrics.opportunityRate > 50 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">
                    ✅ Excelente detecção de oportunidades ({metrics.opportunityRate}%)
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    A IA está identificando oportunidades em mais da metade das conversas.
                  </p>
                </div>
              )}

              {metrics.avgProcessingTime < 2000 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    ⚡ Tempo de resposta excelente ({metrics.avgProcessingTime}ms)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Respostas rápidas melhoram a experiência do cliente.
                  </p>
                </div>
              )}

              {metrics.escalationRate > 20 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-900">
                    ⚠️ Taxa de escalação elevada ({metrics.escalationRate}%)
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Considere revisar os critérios de escalação ou treinar a IA com mais contexto.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}