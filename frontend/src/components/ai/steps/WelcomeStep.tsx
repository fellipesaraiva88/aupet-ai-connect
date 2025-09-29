import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageSquare, Zap, Shield, ChevronRight } from "lucide-react";

interface WelcomeStepProps {
  nextStep: () => void;
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
    <div className="text-center space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6">
          <Bot className="h-12 w-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Bem-vinda à sua Assistente Auzap
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Vamos configurar sua assistente virtual em poucos minutos. 
          Ela cuidará dos seus clientes com carinho e profissionalismo, 
          como se fosse uma extensão da sua equipe.
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8"
      >
        {benefits.map((benefit, index) => (
          <Card key={index} className="border-none bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Video Demo Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-card rounded-xl p-8 border"
      >
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Veja a Assistente Auzap em ação</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          🎬 Demo: Como a IA agenda consultas, responde dúvidas e cuida dos seus clientes automaticamente
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          size="lg"
          onClick={nextStep}
          className="bg-gradient-primary text-white px-8 py-4 text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Começar Configuração
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};