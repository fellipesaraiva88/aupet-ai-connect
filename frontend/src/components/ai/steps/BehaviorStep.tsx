import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Brain, Shield, MessageSquare } from "lucide-react";

interface BehaviorStepProps {
  data: any;
  updateData: (updates: any) => void;
}

const services = [
  { id: "consulta", name: "Consultas Veterinárias", icon: "🏥" },
  { id: "banho", name: "Banho & Tosa", icon: "🛁" },
  { id: "vacina", name: "Vacinação", icon: "💉" },
  { id: "cirurgia", name: "Cirurgias", icon: "🏥" },
  { id: "emergencia", name: "Atendimento de Emergência", icon: "🚨" },
  { id: "hotel", name: "Hotel Pet", icon: "🏨" },
];

const automations = [
  {
    id: "autoReply",
    name: "Resposta Automática",
    description: "Responde mensagens automaticamente 24/7",
    icon: MessageSquare,
    level: "essential"
  },
  {
    id: "scheduleAppointments",
    name: "Agendamento Automático",
    description: "Agenda consultas e serviços automaticamente",
    icon: Clock,
    level: "recommended"
  },
  {
    id: "priceInfo",
    name: "Informações de Preços",
    description: "Fornece preços de serviços quando solicitado",
    icon: Zap,
    level: "recommended"
  },
  {
    id: "customerSupport",
    name: "Suporte ao Cliente",
    description: "Responde dúvidas sobre cuidados pet",
    icon: Brain,
    level: "optional"
  },
  {
    id: "emergencyProtocol",
    name: "Protocolo de Emergência",
    description: "Identifica emergências e aciona a equipe",
    icon: Shield,
    level: "essential"
  }
];

export const BehaviorStep: React.FC<BehaviorStepProps> = ({
  data,
  updateData
}) => {
  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    const currentServices = data.services || [];
    const newServices = enabled
      ? [...currentServices, serviceId]
      : currentServices.filter((s: string) => s !== serviceId);
    updateData({ services: newServices });
  };

  const handleAutomationToggle = (automationId: string, enabled: boolean) => {
    updateData({
      automations: {
        ...data.automations,
        [automationId]: enabled
      }
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Configure o Comportamento</h2>
        <p className="text-muted-foreground">
          Defina quando e como sua assistente deve agir
        </p>
      </motion.div>

      {/* Horário de Funcionamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Ativar horário comercial</Label>
                <p className="text-sm text-muted-foreground">
                  IA ativa apenas durante o expediente
                </p>
              </div>
              <Switch
                checked={data.businessHours?.enabled || false}
                onCheckedChange={(enabled) =>
                  updateData({
                    businessHours: { ...data.businessHours, enabled }
                  })
                }
              />
            </div>
            
            {data.businessHours?.enabled && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Abertura</Label>
                  <input
                    type="time"
                    value={data.businessHours?.start || "08:00"}
                    onChange={(e) =>
                      updateData({
                        businessHours: {
                          ...data.businessHours,
                          start: e.target.value
                        }
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label>Fechamento</Label>
                  <input
                    type="time"
                    value={data.businessHours?.end || "18:00"}
                    onChange={(e) =>
                      updateData({
                        businessHours: {
                          ...data.businessHours,
                          end: e.target.value
                        }
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Serviços Disponíveis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Serviços que a IA pode agendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    data.services?.includes(service.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    handleServiceToggle(
                      service.id,
                      !data.services?.includes(service.id)
                    )
                  }
                >
                  <div className="text-2xl mb-2">{service.icon}</div>
                  <p className="text-sm font-medium">{service.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Automações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Automações Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <automation.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{automation.name}</Label>
                      <Badge
                        variant={
                          automation.level === 'essential' ? 'default' :
                          automation.level === 'recommended' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {automation.level === 'essential' ? 'Essencial' :
                         automation.level === 'recommended' ? 'Recomendado' : 'Opcional'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {automation.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={data.automations?.[automation.id] || false}
                  onCheckedChange={(enabled) =>
                    handleAutomationToggle(automation.id, enabled)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Configurações Avançadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Configurações Avançadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delay de Resposta */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Delay de Resposta: {data.responseDelay || 2} segundos
              </Label>
              <Slider
                value={[data.responseDelay || 2]}
                onValueChange={(value) => updateData({ responseDelay: value[0] })}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                A IA aguarda antes de responder para parecer mais natural
              </p>
            </div>

            {/* Criatividade */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Criatividade: {Math.round((data.temperature || 0.7) * 100)}%
              </Label>
              <Slider
                value={[data.temperature || 0.7]}
                onValueChange={(value) => updateData({ temperature: value[0] })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {(data.temperature || 0.7) < 0.3 
                  ? "Respostas mais previsíveis e consistentes"
                  : (data.temperature || 0.7) < 0.7 
                  ? "Balanceado entre consistência e criatividade"
                  : "Respostas mais criativas e variadas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};