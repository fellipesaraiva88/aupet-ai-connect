import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Bot, Users, Zap, BarChart3, ArrowRight, Sparkles } from "lucide-react";

interface ActivationStepProps {
  data: any;
  onComplete: () => void;
}

export const ActivationStep: React.FC<ActivationStepProps> = ({
  data,
  onComplete
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handleActivation = async () => {
    setIsActivating(true);
    
    // Simulate activation process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsActivating(false);
    setIsActivated(true);
    
    // Complete onboarding after a short delay
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const configSummary = [
    { label: "Nome", value: data.assistantName || "Assistente Auzap" },
    { label: "Personalidade", value: data.personality === 'friendly' ? 'Amigável' : 
                                   data.personality === 'professional' ? 'Profissional' : 
                                   data.personality === 'enthusiastic' ? 'Entusiasta' : 'Empática' },
    { label: "Serviços", value: `${data.services?.length || 0} configurados` },
    { label: "Automações", value: `${Object.values(data.automations || {}).filter(Boolean).length} ativas` },
    { label: "Horário", value: data.businessHours?.enabled ? `${data.businessHours.start} - ${data.businessHours.end}` : "24/7" }
  ];

  const nextSteps = [
    {
      icon: Users,
      title: "Conectar ao WhatsApp",
      description: "Vincule sua conta WhatsApp Business",
      action: "Conectar agora"
    },
    {
      icon: BarChart3,
      title: "Monitorar Performance",
      description: "Acompanhe métricas e feedbacks",
      action: "Ver dashboard"
    },
    {
      icon: Bot,
      title: "Treinar mais a IA",
      description: "Adicione mais conhecimento específico",
      action: "Continuar treinamento"
    }
  ];

  if (isActivated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Assistente Ativada! 🎉
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Sua {data.assistantName} está online e pronta para cuidar dos seus clientes com carinho!
          </p>
        </div>

        <div className="bg-gradient-card rounded-xl p-6 border">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-green-700">Sistema Online</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Aguardando primeira mensagem dos clientes...
          </p>
        </div>

        <Button
          size="lg"
          onClick={onComplete}
          className="bg-gradient-primary text-white px-8 py-4 text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Ir para Dashboard
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Tudo Pronto!</h2>
        <p className="text-muted-foreground">
          Revise as configurações e ative sua assistente
        </p>
      </motion.div>

      {/* Configuration Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resumo da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configSummary.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-sm">{item.label}:</span>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 bg-gradient-card">
          <CardHeader>
            <CardTitle>Preview da Assistente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-whatsapp-light rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {data.assistantName?.charAt(0) || 'A'}
                </div>
                <div>
                  <span className="font-medium">{data.assistantName}</span>
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Online
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 inline-block max-w-[80%]">
                <p className="text-sm">
                  Olá! Sou a {data.assistantName} 😊 Estou aqui para cuidar do seu pet com muito carinho. 
                  Como posso ajudar você hoje?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activation Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button
          size="lg"
          onClick={handleActivation}
          disabled={isActivating}
          className="bg-gradient-primary text-white px-12 py-6 text-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {isActivating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              Ativando Assistente...
            </>
          ) : (
            <>
              <Rocket className="h-6 w-6 mr-3" />
              Ativar Assistente Auzap
            </>
          )}
        </Button>
        
        {isActivating && (
          <p className="text-sm text-muted-foreground mt-4">
            Configurando sistemas de IA e conectando aos serviços...
          </p>
        )}
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Próximos Passos Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {step.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};