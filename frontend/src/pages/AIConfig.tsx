import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Bot, Settings, Sparkles } from "lucide-react";
import { OnboardingWizard } from "@/components/ai/OnboardingWizard";

const AIConfig = () => {
  const activeMenuItem = useActiveNavigation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false); // Start disabled for onboarding
  
  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    setAiEnabled(true);
    setShowOnboarding(false);
    toast({
      title: "Assistente Ativada! 🎉",
      description: `${data.assistantName} está online e pronta para cuidar dos seus clientes!`,
    });
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* AI-themed floating elements */}
      <div className="absolute inset-0 paw-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-16 left-16 w-20 h-20 bg-gradient-to-br from-primary/30 to-purple-400/30 rounded-full glass-morphism animate-glass-float" />
      <div className="absolute top-60 right-32 w-14 h-14 bg-gradient-to-br from-accent/30 to-pink-400/30 rounded-full glass-morphism animate-pet-bounce delay-500" />
      <div className="absolute bottom-32 left-1/4 w-10 h-10 bg-gradient-to-br from-secondary/30 to-blue-400/30 rounded-full glass-morphism animate-glass-float delay-1000" />

      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <main className="flex-1 overflow-auto relative">
          <div className="p-8 space-y-6">
            {/* Modern Header */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-primary to-purple-600 rounded-3xl shadow-2xl inline-block">
                  <Bot className="h-16 w-16 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full animate-pulse border-4 border-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Assistente Auzap IA
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Transforme seu atendimento com uma assistente virtual que cuida dos seus clientes 
                  com o carinho e profissionalismo que eles merecem
                </p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gradient-card rounded-xl p-6 border shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${aiEnabled ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                    <span className="font-semibold">
                      {aiEnabled ? 'IA Online' : 'IA Offline'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {aiEnabled ? 'Cuidando dos clientes 24/7' : 'Aguardando configuração'}
                  </p>
                </div>

                <div className="bg-gradient-card rounded-xl p-6 border shadow-soft">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Personalização</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure personalidade e comportamento
                  </p>
                </div>

                <div className="bg-gradient-card rounded-xl p-6 border shadow-soft">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Automação</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Agendamentos e respostas automáticas
                  </p>
                </div>
              </div>

              {/* Main CTA */}
              {!aiEnabled ? (
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={handleStartOnboarding}
                    className="bg-gradient-primary text-white px-12 py-6 text-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Bot className="h-6 w-6 mr-3" />
                    Configurar Assistente Auzap
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    ⚡ Configuração em 5 minutos • 🤖 IA especializada em pets • 🚀 Ativação instantânea
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      🎉 Assistente Ativada com Sucesso!
                    </h3>
                    <p className="text-green-600">
                      Sua IA está online e pronta para cuidar dos seus clientes com excelência.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowOnboarding(true)}
                    className="hover:shadow-lg transition-all duration-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Ajustar Configurações
                  </Button>
                </div>
              )}
            </div>

            {/* Features Preview */}
            {!aiEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: "🤖",
                    title: "IA Conversacional",
                    description: "Conversa naturalmente com seus clientes, entendendo suas necessidades"
                  },
                  {
                    icon: "📅",
                    title: "Agendamento Automático", 
                    description: "Agenda consultas e serviços automaticamente no seu sistema"
                  },
                  {
                    icon: "💬",
                    title: "WhatsApp Integrado",
                    description: "Funciona direto no WhatsApp, onde seus clientes já estão"
                  },
                  {
                    icon: "🏥",
                    title: "Especialista em Pets",
                    description: "Treinada especificamente para pet shops e clínicas veterinárias"
                  },
                  {
                    icon: "🚨",
                    title: "Detecção de Emergências",
                    description: "Identifica emergências veterinárias e aciona sua equipe"
                  },
                  {
                    icon: "📊",
                    title: "Analytics Completo",
                    description: "Acompanhe performance, satisfação e métricas importantes"
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-gradient-card rounded-xl p-6 border hover:shadow-glow transition-all duration-300">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default AIConfig;