import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Zap, CheckCircle } from "lucide-react";

export function AIPerformance() {
  const aiStats = [
    {
      label: "Respostas Automáticas",
      value: 87,
      total: 100,
      description: "87 de 100 conversas hoje",
    },
    {
      label: "Taxa de Resolução",
      value: 73,
      total: 100,
      description: "73% resolvidas sem humano",
    },
    {
      label: "Satisfação IA",
      value: 92,
      total: 100,
      description: "4.6/5 nas avaliações",
    },
  ];

  const quickActions = [
    { label: "Agendar Banho", count: 34 },
    { label: "Informações", count: 28 },
    { label: "Reagendar", count: 15 },
    { label: "Preços", count: 12 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Performance da IA
        </CardTitle>
        <CardDescription>
          Como sua assistente está performando hoje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas de Performance */}
        <div className="space-y-4">
          {aiStats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{stat.label}</span>
                <span className="text-sm text-muted-foreground">
                  {stat.value}%
                </span>
              </div>
              <Progress value={stat.value} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Status da IA */}
        <div className="rounded-lg bg-gradient-to-br from-success/5 to-success/10 border border-success/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">
              IA Operacional
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Processando mensagens em tempo real • Último treino: hoje
          </p>
        </div>

        {/* Ações Mais Executadas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ações Mais Executadas
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md bg-accent/50"
              >
                <span className="text-xs font-medium">{action.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {action.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Tendência */}
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-success font-medium">+15%</span>
          <span className="text-muted-foreground">vs. semana passada</span>
        </div>
      </CardContent>
    </Card>
  );
}