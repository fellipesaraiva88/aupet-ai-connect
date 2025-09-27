import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  User,
  Building,
  MessageSquare,
  Shield,
  Smartphone,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const Settings = () => {
  const activeMenuItem = useActiveNavigation();
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    // Business Info
    businessName: "Meu Pet VIP",
    ownerName: "Dr. Ana Silva",
    email: "ana@meupetvip.com",
    phone: "+55 11 99999-1234",
    address: "Rua das Flores, 123 - São Paulo, SP",
    cnpj: "12.345.678/0001-90",

    // WhatsApp Settings
    whatsappNumber: "+55 11 99999-1234",
    welcomeMessage: "Olá! Bem-vindo ao {businessName}. Como posso ajudar você e seu pet hoje?",
    autoReply: true,
    businessHours: true,

    // AI Settings
    aiPersonality: "professional",
    responseDelay: 2,
    escalationKeywords: ["humano", "atendente", "falar com alguém"],

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyNewCustomer: true,
    notifyMissedMessage: true,

    // Security
    apiKey: "sk-auzap-1234567890abcdef",
    twoFactorAuth: false,
    sessionTimeout: 8,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
                <h1 className="text-3xl font-primary font-bold tracking-tight text-primary flex items-center gap-3">
                  <SettingsIcon className="h-8 w-8" />
                  Configurações
                </h1>
                <p className="text-muted-foreground font-secondary">
                  Configure sua conta e preferências do sistema
                </p>
              </div>

              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>

            <Tabs defaultValue="business" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Negócio
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  IA
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Segurança
                </TabsTrigger>
              </TabsList>

              {/* Business Settings */}
              <TabsContent value="business">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Negócio</CardTitle>
                      <CardDescription>
                        Configure os dados básicos do seu petshop
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Negócio</label>
                          <Input
                            value={settings.businessName}
                            onChange={(e) => handleSettingChange('businessName', e.target.value)}
                            placeholder="Nome do seu petshop"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Proprietário</label>
                          <Input
                            value={settings.ownerName}
                            onChange={(e) => handleSettingChange('ownerName', e.target.value)}
                            placeholder="Seu nome completo"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={settings.email}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Telefone</label>
                          <Input
                            value={settings.phone}
                            onChange={(e) => handleSettingChange('phone', e.target.value)}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Endereço</label>
                        <Input
                          value={settings.address}
                          onChange={(e) => handleSettingChange('address', e.target.value)}
                          placeholder="Rua, número - Cidade, Estado"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">CNPJ</label>
                        <Input
                          value={settings.cnpj}
                          onChange={(e) => handleSettingChange('cnpj', e.target.value)}
                          placeholder="12.345.678/0001-90"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* WhatsApp Settings */}
              <TabsContent value="whatsapp">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações do WhatsApp</CardTitle>
                      <CardDescription>
                        Configure como o Auzap.ai interage via WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Número do WhatsApp</label>
                        <Input
                          value={settings.whatsappNumber}
                          onChange={(e) => handleSettingChange('whatsappNumber', e.target.value)}
                          placeholder="+55 11 99999-9999"
                        />
                        <p className="text-xs text-muted-foreground">
                          Número que será usado para atendimento automático
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                        <Textarea
                          value={settings.welcomeMessage}
                          onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
                          placeholder="Mensagem que será enviada quando um novo cliente entrar em contato"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use {"{businessName}"} para incluir o nome do seu negócio
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Resposta Automática</label>
                            <p className="text-xs text-muted-foreground">
                              Ativar respostas automáticas da IA
                            </p>
                          </div>
                          <Switch
                            checked={settings.autoReply}
                            onCheckedChange={(checked) => handleSettingChange('autoReply', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Respeitar Horário Comercial</label>
                            <p className="text-xs text-muted-foreground">
                              Pausar automação fora do horário de funcionamento
                            </p>
                          </div>
                          <Switch
                            checked={settings.businessHours}
                            onCheckedChange={(checked) => handleSettingChange('businessHours', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* AI Settings */}
              <TabsContent value="ai">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações da IA</CardTitle>
                      <CardDescription>
                        Personalize o comportamento do assistente virtual
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Personalidade da IA</label>
                        <Select
                          value={settings.aiPersonality}
                          onValueChange={(value) => handleSettingChange('aiPersonality', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="friendly">Amigável</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Delay de Resposta (segundos)</label>
                        <Select
                          value={settings.responseDelay.toString()}
                          onValueChange={(value) => handleSettingChange('responseDelay', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Imediato</SelectItem>
                            <SelectItem value="1">1 segundo</SelectItem>
                            <SelectItem value="2">2 segundos</SelectItem>
                            <SelectItem value="3">3 segundos</SelectItem>
                            <SelectItem value="5">5 segundos</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Simula tempo de digitação humana
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Palavras-chave para Escalação</label>
                        <Textarea
                          value={settings.escalationKeywords.join(', ')}
                          onChange={(e) => handleSettingChange('escalationKeywords', e.target.value.split(', '))}
                          placeholder="humano, atendente, falar com alguém"
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Quando o cliente usar essas palavras, será direcionado para atendimento humano
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferências de Notificação</CardTitle>
                      <CardDescription>
                        Configure como e quando receber notificações
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Notificações por Email</label>
                            <p className="text-xs text-muted-foreground">
                              Receber resumos diários por email
                            </p>
                          </div>
                          <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Notificações por SMS</label>
                            <p className="text-xs text-muted-foreground">
                              Receber alertas importantes via SMS
                            </p>
                          </div>
                          <Switch
                            checked={settings.smsNotifications}
                            onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Notificações Push</label>
                            <p className="text-xs text-muted-foreground">
                              Receber notificações no navegador
                            </p>
                          </div>
                          <Switch
                            checked={settings.pushNotifications}
                            onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Novo Cliente</label>
                            <p className="text-xs text-muted-foreground">
                              Notificar quando um novo cliente se cadastrar
                            </p>
                          </div>
                          <Switch
                            checked={settings.notifyNewCustomer}
                            onCheckedChange={(checked) => handleSettingChange('notifyNewCustomer', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Mensagem Perdida</label>
                            <p className="text-xs text-muted-foreground">
                              Notificar quando uma mensagem não for respondida
                            </p>
                          </div>
                          <Switch
                            checked={settings.notifyMissedMessage}
                            onCheckedChange={(checked) => handleSettingChange('notifyMissedMessage', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Segurança</CardTitle>
                      <CardDescription>
                        Mantenha sua conta segura
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key do Auzap.ai</label>
                        <div className="flex gap-2">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={settings.apiKey}
                            onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                            placeholder="sk-auzap-..."
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Chave de acesso para integração com a API do Auzap.ai
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Autenticação de Dois Fatores</label>
                          <p className="text-xs text-muted-foreground">
                            Adicione uma camada extra de segurança
                          </p>
                        </div>
                        <Switch
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Timeout da Sessão (horas)</label>
                        <Select
                          value={settings.sessionTimeout.toString()}
                          onValueChange={(value) => handleSettingChange('sessionTimeout', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="4">4 horas</SelectItem>
                            <SelectItem value="8">8 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-2">Status da Segurança</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <Badge className="bg-success text-white mb-2">Ativo</Badge>
                            <p className="text-xs text-muted-foreground">SSL/TLS</p>
                          </div>
                          <div className="text-center">
                            <Badge className="bg-success text-white mb-2">Ativo</Badge>
                            <p className="text-xs text-muted-foreground">Criptografia</p>
                          </div>
                          <div className="text-center">
                            <Badge className="bg-success text-white mb-2">Ativo</Badge>
                            <p className="text-xs text-muted-foreground">Backup</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;