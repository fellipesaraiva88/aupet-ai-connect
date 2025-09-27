import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { AIPerformance } from "@/components/dashboard/ai-performance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, MessageSquare, Calendar, TrendingUp, Users, ArrowRight, Play, Bot, Heart } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
const Index = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        
        {/* Content */}
        <div className="relative">
          <Navbar />
          
          
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex h-screen">
        <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao seu petshop! 🐾</h1>
                <p className="text-muted-foreground">
                  Aqui você cuida do que mais importa: seus clientes e seus pets
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Últimos 30 dias
                </Button>
                <Button variant="hero">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Crescimento
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
                    Ações do Coração
                  </CardTitle>
                  <CardDescription>
                    Tudo que você precisa para cuidar melhor dos pets
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Conversar</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Agendar Visita</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Novo Amigo</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Heart className="h-6 w-6" />
                    <span className="text-sm">Novo Pet</span>
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Tudo Funcionando</CardTitle>
                  <CardDescription>
                    Seus clientes sempre bem atendidos
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
                      <span className="text-sm font-medium">Assistente Auzap</span>
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
    </div>;
};
export default Index;