import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageSquare, Zap, Shield, ChevronRight } from "lucide-react";

interface WelcomeStepProps {
  nextStep: () => void;
  data?: any;
  updateData?: (updates: any) => void;
  prevStep?: () => void;
  onComplete?: () => void;
}

const benefits = [
  {
    icon: Bot,
    title: "IA Inteligente",
    description: "Assistente virtual que aprende com suas necessidades"
  },
  {
    icon: MessageSquare,
    title: "Atendimento 24/7",
    description: "Responde seus clientes a qualquer hora do dia"
  },
  {
    icon: Zap,
    title: "Automação Completa",
    description: "Agenda, reagenda e gerencia seus serviços automaticamente"
  },
  {
    icon: Shield,
    title: "Seguro e Confiável",
    description: "Dados protegidos com a melhor tecnologia de segurança"
  }
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ nextStep }) => {
  return (
    <div className="text-center space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Bem-vinda à sua Assistente Auzap
        </h1>
        
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Vamos configurar sua assistente virtual em poucos minutos. 
          Ela cuidará dos seus clientes com carinho e profissionalismo.
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {benefits.map((benefit, index) => (
          <Card key={index} className="border-none bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-card rounded-lg p-4 border"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            🎬 Veja como a IA agenda consultas e cuida dos clientes automaticamente
          </p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={nextStep}
          className="bg-gradient-primary text-white px-6 py-3 hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Começar Configuração
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};