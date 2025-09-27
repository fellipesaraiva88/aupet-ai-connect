import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { AIPerformance } from "@/components/dashboard/ai-performance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  MessageSquare,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Play,
  Bot,
  Heart,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const Index = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        
        {/* Content */}
        <div className="relative">
          <Navbar />
          
          <div className="container mx-auto px-6 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Hero content */}
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <Badge variant="secondary" className="w-fit">
                    <Zap className="h-3 w-3 mr-1" />
                    Powered by AI
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                    Transforme seu{" "}
                    <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                      atendimento pet
                    </span>{" "}
                    com IA
                  </h1>
                  <p className="text-xl text-white/80 leading-relaxed">
                    O Auzap é a plataforma completa para petshops e clínicas veterinárias. 
                    Automatize seu WhatsApp, organize seus clientes e venda mais com inteligência artificial.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="xl" variant="accent" className="group">
                    <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Começar Agora
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Ver Demo
                  </Button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">87%</div>
                    <div className="text-sm text-white/60">Automação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">2.3s</div>
                    <div className="text-sm text-white/60">Tempo Resposta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">1000+</div>
                    <div className="text-sm text-white/60">Pet Shops</div>
                  </div>
                </div>
              </div>

              {/* Right column - Hero image */}
              <div className="relative animate-slide-up">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl transform rotate-1" />
                <img
                  src={heroImage}
                  alt="Veterinário atendendo pets com tecnologia"
                  className="relative rounded-2xl shadow-large w-full h-auto"
                />
                <div className="absolute -bottom-4 -left-4 bg-whatsapp text-white p-4 rounded-xl shadow-glow animate-bounce-gentle">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="absolute -top-4 -right-4 bg-gradient-primary text-white p-4 rounded-xl shadow-glow">
                  <Bot className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex h-screen">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={setActiveMenuItem}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Visão geral do seu negócio pet
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Últimos 30 dias
                </Button>
                <Button variant="hero">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Relatório Completo
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Conversations - Takes 2 columns */}
              <RecentConversations />
              
              {/* AI Performance - Takes 1 column */}
              <AIPerformance />
            </div>

            {/* Additional Content */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Tarefas mais comuns do seu dia a dia
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Nova Conversa</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Agendar</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Novo Cliente</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Heart className="h-6 w-6" />
                    <span className="text-sm">Cadastrar Pet</span>
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>
                    Todos os serviços operacionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                      <span className="text-sm font-medium">WhatsApp API</span>
                    </div>
                    <Badge variant="secondary" className="text-success">
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                      <span className="text-sm font-medium">IA Assistant</span>
                    </div>
                    <Badge variant="secondary" className="text-success">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                      <span className="text-sm font-medium">Base de Dados</span>
                    </div>
                    <Badge variant="secondary" className="text-success">
                      Online
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;