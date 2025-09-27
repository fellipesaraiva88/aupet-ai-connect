import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  MessageSquare,
  Settings,
  Zap,
  Brain,
  Clock,
  Users,
  Shield,
  Sparkles,
  Play,
  Save,
  Loader2,
} from "lucide-react";

const AIConfig = () => {
  const activeMenuItem = useActiveNavigation();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);
  const [responseDelay, setResponseDelay] = useState([2]);
  const [temperature, setTemperature] = useState([0.7]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Form state
  const [aiConfig, setAiConfig] = useState({
    name: "Assistente Pet Care",
    personality: "friendly",
    systemPrompt: "Você é uma assistente virtual especializada em pet shops e clínicas veterinárias. Seja sempre cordial, profissional e prestativa. Demonstre paixão genuína pelo bem-estar dos animais. Use linguagem acessível e empática ao falar com os tutores dos pets.",
    responseLength: "medium",
    escalationKeywords: "urgente, emergência, reclamação, problema, erro",
    messageLimit: 10,
    openingTime: "08:00",
    closingTime: "18:00",
    automations: {
      scheduleServices: true,
      rescheduleAppointments: true,
      priceInformation: true,
      appointmentStatus: true,
      processPayments: false,
      cancelServices: false,
    }
  });

  // Handler functions
  const handleFieldChange = (field: string, value: string | number) => {
    setAiConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAutomationChange = (automation: string, enabled: boolean) => {
    setAiConfig(prev => ({
      ...prev,
      automations: {
        ...prev.automations,
        [automation]: enabled
      }
    }));
  };

  const handleTestAI = async () => {
    setIsTesting(true);
    toast({
      title: "Testando IA",
      description: "Iniciando teste da configuração atual...",
    });

    // Simulate API call
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: "Teste concluído",
        description: "IA respondeu corretamente ao teste!",
      });
    }, 2000);
  };

  const handleSaveConfiguration = async () => {
    setIsLoading(true);
    toast({
      title: "Salvando configurações",
      description: "Atualizando configurações da IA...",
    });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configurações salvas",
        description: "Todas as configurações foram aplicadas com sucesso!",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Bot className="h-8 w-8 text-primary" />
                  Configuração da IA
                </h1>
                <p className="text-muted-foreground">
                  Personalize como sua assistente inteligente atende seus clientes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={aiEnabled ? "secondary" : "secondary"} className={`px-3 py-1 ${aiEnabled ? 'text-success' : ''}`}>
                  <div className={`h-2 w-2 rounded-full mr-2 ${aiEnabled ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground'}`} />
                  {aiEnabled ? "IA Ativa" : "IA Desativada"}
                </Badge>
                <Button
                  variant="outline"
                  onClick={handleTestAI}
                  disabled={isTesting}
                >
                  {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Testar IA
                </Button>
                <Button
                  variant="hero"
                  onClick={handleSaveConfiguration}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Configurações
                </Button>
              </div>
            </div>

            {/* Main Configuration */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="personality" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personality" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Personalidade
                    </TabsTrigger>
                    <TabsTrigger value="behavior" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Comportamento
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automação
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Segurança
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personality" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personalidade da IA</CardTitle>
                        <CardDescription>
                          Configure como sua assistente se comporta e responde aos clientes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="ai-name">Nome da Assistente</Label>
                          <Input
                            id="ai-name"
                            placeholder="Ex: Luna, Assistente Auzap..."
                            value={aiConfig.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="personality-type">Tipo de Personalidade</Label>
                          <Select
                            value={aiConfig.personality}
                            onValueChange={(value) => handleFieldChange('personality', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="friendly">Amigável e Calorosa</SelectItem>
                              <SelectItem value="professional">Profissional</SelectItem>
                              <SelectItem value="casual">Casual e Descontraída</SelectItem>
                              <SelectItem value="empathetic">Empática e Cuidadosa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="system-prompt">Prompt do Sistema</Label>
                          <Textarea
                            id="system-prompt"
                            placeholder="Descreva como a IA deve se comportar..."
                            className="min-h-[150px]"
                            value={aiConfig.systemPrompt}
                            onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                          />
                        </div>

                        <div className="space-y-4">
                          <Label>Criatividade das Respostas</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Conservadora</span>
                              <span>Criativa</span>
                            </div>
                            <Slider
                              value={temperature}
                              onValueChange={setTemperature}
                              max={1}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Valor atual: {temperature[0]} - 
                              {temperature[0] < 0.3 ? " Respostas mais previsíveis e consistentes" :
                               temperature[0] < 0.7 ? " Balanceado entre consistência e criatividade" :
                               " Respostas mais criativas e variadas"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Comportamento da IA</CardTitle>
                        <CardDescription>
                          Configure quando e como a IA deve responder
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Respostas Automáticas</Label>
                            <p className="text-sm text-muted-foreground">
                              A IA responde automaticamente às mensagens
                            </p>
                          </div>
                          <Switch
                            checked={autoReply}
                            onCheckedChange={setAutoReply}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Apenas em Horário Comercial</Label>
                            <p className="text-sm text-muted-foreground">
                              IA ativa apenas durante o horário de funcionamento
                            </p>
                          </div>
                          <Switch
                            checked={businessHoursOnly}
                            onCheckedChange={setBusinessHoursOnly}
                          />
                        </div>

                        <div className="space-y-4">
                          <Label>Delay de Resposta (segundos)</Label>
                          <div className="space-y-2">
                            <Slider
                              value={responseDelay}
                              onValueChange={setResponseDelay}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              A IA aguarda {responseDelay[0]} segundos antes de responder para parecer mais natural
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max-tokens">Tamanho Máximo das Respostas</Label>
                          <Select
                            value={aiConfig.responseLength}
                            onValueChange={(value) => handleFieldChange('responseLength', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Curta (até 50 palavras)</SelectItem>
                              <SelectItem value="medium">Média (até 100 palavras)</SelectItem>
                              <SelectItem value="long">Longa (até 200 palavras)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="automation" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Automações Disponíveis</CardTitle>
                        <CardDescription>
                          Configure quais ações a IA pode executar automaticamente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { key: "scheduleServices", name: "Agendar Serviços", description: "Permitir que a IA agende banhos, tosas e consultas" },
                          { key: "rescheduleAppointments", name: "Reagendar Compromissos", description: "IA pode remarcar agendamentos existentes" },
                          { key: "priceInformation", name: "Informações de Preços", description: "Fornecer preços de serviços e produtos" },
                          { key: "appointmentStatus", name: "Status de Agendamentos", description: "Consultar e informar status de agendamentos" },
                          { key: "processPayments", name: "Processar Pagamentos", description: "Iniciar processo de cobrança e pagamento" },
                          { key: "cancelServices", name: "Cancelar Serviços", description: "Permitir cancelamento de agendamentos" },
                        ].map((automation, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="space-y-1">
                              <Label className="font-medium">{automation.name}</Label>
                              <p className="text-sm text-muted-foreground">{automation.description}</p>
                            </div>
                            <Switch
                              checked={aiConfig.automations[automation.key as keyof typeof aiConfig.automations]}
                              onCheckedChange={(checked) => handleAutomationChange(automation.key, checked)}
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Segurança</CardTitle>
                        <CardDescription>
                          Defina limites e regras de segurança para a IA
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="escalation-keywords">Palavras-chave para Escalação</Label>
                          <Textarea
                            id="escalation-keywords"
                            placeholder="urgente, emergência, reclamação, problema, erro..."
                            className="min-h-[100px]"
                            value={aiConfig.escalationKeywords}
                            onChange={(e) => handleFieldChange('escalationKeywords', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Mensagens com essas palavras serão automaticamente transferidas para um humano
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Limite de Mensagens por Conversa</Label>
                          <Input
                            type="number"
                            value={aiConfig.messageLimit}
                            onChange={(e) => handleFieldChange('messageLimit', parseInt(e.target.value) || 10)}
                            min="1"
                            max="50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Após esse número de mensagens, a conversa é transferida para um humano
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Horário de Funcionamento</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Abertura</Label>
                              <Input
                                type="time"
                                value={aiConfig.openingTime}
                                onChange={(e) => handleFieldChange('openingTime', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fechamento</Label>
                              <Input
                                type="time"
                                value={aiConfig.closingTime}
                                onChange={(e) => handleFieldChange('closingTime', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Preview da Conversa
                    </CardTitle>
                    <CardDescription>
                      Veja como a IA responderia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 bg-gradient-to-b from-whatsapp-light/20 to-background p-4 rounded-lg max-h-96 overflow-auto">
                      <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-lg px-3 py-2 max-w-[80%]">
                          <p className="text-sm">Olá! Gostaria de agendar um banho para meu Golden Retriever</p>
                          <span className="text-xs text-muted-foreground">14:30</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="bg-whatsapp text-white rounded-lg px-3 py-2 max-w-[80%]">
                          <p className="text-sm">Olá! Ficaria feliz em ajudar você a agendar um banho para seu Golden! 🐕 Que dia seria melhor para vocês?</p>
                          <span className="text-xs text-white/70">14:31</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleTestAI}
                      disabled={isTesting}
                    >
                      {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Simular Conversa
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Status da IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status Geral</span>
                      <Badge variant="secondary" className="text-success">Operacional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Último Treino</span>
                      <span className="text-sm text-muted-foreground">Hoje, 09:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversas Hoje</span>
                      <span className="text-sm font-medium">87</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taxa de Resolução</span>
                      <span className="text-sm font-medium">73%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIConfig;