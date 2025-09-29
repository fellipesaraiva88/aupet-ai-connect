import React, { useState, useEffect } from "react";
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
import { toast } from "@/components/ui/sonner";
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
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useCreateOrganizationSettings,
  useOrganizationId,
  type OrganizationSettings
} from "@/hooks/useApiData";

const Settings = () => {
  const activeMenuItem = useActiveNavigation();
  const organizationId = useOrganizationId();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // API hooks
  const { data: settings, isLoading, error } = useOrganizationSettings(organizationId);
  const updateSettingsMutation = useUpdateOrganizationSettings();
  const createSettingsMutation = useCreateOrganizationSettings();

  // Local state for form
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || "",
        owner_name: settings.owner_name || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        cnpj: settings.cnpj || "",
        whatsapp_number: settings.whatsapp_number || "",
        welcome_message: settings.welcome_message || "Olá! Bem-vindo ao {businessName}. Como posso ajudar você e seu pet hoje?",
        auto_reply: settings.auto_reply ?? true,
        business_hours: settings.business_hours ?? true,
        ai_personality: settings.ai_personality || "professional",
        response_delay: settings.response_delay ?? 2,
        escalation_keywords: settings.escalation_keywords || ["humano", "atendente", "falar com alguém"],
        email_notifications: settings.email_notifications ?? true,
        sms_notifications: settings.sms_notifications ?? false,
        push_notifications: settings.push_notifications ?? true,
        notify_new_customer: settings.notify_new_customer ?? true,
        notify_missed_message: settings.notify_missed_message ?? true,
        api_key: settings.api_key || "",
        two_factor_auth: settings.two_factor_auth ?? false,
        session_timeout: settings.session_timeout ?? 8,
      });
      setHasUnsavedChanges(false);
    } else if (!isLoading && !settings) {
      // Initialize with default values if no settings exist
      setFormData({
        business_name: "Meu Pet VIP",
        owner_name: "Dr. Ana Silva",
        email: "ana@meupetvip.com",
        phone: "+55 11 99999-1234",
        address: "Rua das Flores, 123 - São Paulo, SP",
        cnpj: "12.345.678/0001-90",
        whatsapp_number: "+55 11 99999-1234",
        welcome_message: "Olá! Bem-vindo ao {businessName}. Como posso ajudar você e seu pet hoje?",
        auto_reply: true,
        business_hours: true,
        ai_personality: "professional",
        response_delay: 2,
        escalation_keywords: ["humano", "atendente", "falar com alguém"],
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        notify_new_customer: true,
        notify_missed_message: true,
        api_key: "sk-auzap-1234567890abcdef",
        two_factor_auth: false,
        session_timeout: 8,
      });
    }
  }, [settings, isLoading]);

  const handleSettingChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!formData || !organizationId) {
      toast.error("Dados incompletos para salvar as configurações 🐾");
      return;
    }

    setIsSaving(true);

    try {
      const settingsToSave = {
        ...formData,
        organization_id: organizationId,
      };

      if (settings?.id) {
        // Update existing settings
        await updateSettingsMutation.mutateAsync({
          organizationId,
          updates: settingsToSave
        });
        toast.success("Configurações atualizadas com sucesso! 🎉");
      } else {
        // Create new settings
        await createSettingsMutation.mutateAsync(settingsToSave as Omit<OrganizationSettings, 'id' | 'created_at' | 'updated_at'>);
        toast.success("Configurações salvas com sucesso! 🎉");
      }

      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || "Erro ao salvar configurações. Tente novamente! 🐾");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Ajustando as configurações pet... ⚙️🐾</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <SettingsIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-700">Erro ao carregar configurações</h3>
          <p className="text-red-600">Não foi possível carregar as configurações. Tente recarregar a página.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 relative overflow-hidden">
      {/* Floating pet elements background */}
      <div className="absolute inset-0 paw-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full glass-morphism animate-glass-float" />
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full glass-morphism animate-pet-bounce delay-1000" />

      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />

        <main className="flex-1 overflow-auto relative">
          <div className="p-8 space-y-6">
            {/* Enhanced Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-primary rounded-xl shadow-lg pet-glow">
                    <SettingsIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-primary font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Configurações
                    </h1>
                    <p className="text-muted-foreground font-secondary text-lg">
                      Configure sua conta e preferências do sistema com carinho
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || !hasUnsavedChanges}
                className="glass-morphism bg-gradient-primary text-white hover:shadow-lg hover:scale-105 transition-all duration-300 px-6 py-3 disabled:opacity-50 disabled:transform-none"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : hasUnsavedChanges ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Salvando..." : hasUnsavedChanges ? "Salvar Alterações" : "Salvo"}
              </Button>
            </div>

            <Tabs defaultValue="business" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 glass-morphism bg-gradient-to-r from-white/80 to-blue-50/80 p-2 rounded-xl">
                <TabsTrigger value="business" className="flex items-center gap-2 transition-all duration-300 hover:bg-gradient-primary hover:text-white rounded-lg">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Negócio</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2 transition-all duration-300 hover:bg-gradient-primary hover:text-white rounded-lg">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2 transition-all duration-300 hover:bg-gradient-primary hover:text-white rounded-lg">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">IA</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2 transition-all duration-300 hover:bg-gradient-primary hover:text-white rounded-lg">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificações</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 transition-all duration-300 hover:bg-gradient-primary hover:text-white rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Segurança</span>
                </TabsTrigger>
              </TabsList>

              {/* Business Settings */}
              <TabsContent value="business">
                <div className="grid gap-6">
                  <Card className="glass-morphism bg-gradient-card border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-primary rounded-lg">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-primary text-primary">Informações do Negócio</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Configure os dados básicos do seu petshop com amor
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Negócio</label>
                          <Input
                            value={formData.business_name || ""}
                            onChange={(e) => handleSettingChange('business_name', e.target.value)}
                            placeholder="Nome do seu petshop"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Proprietário</label>
                          <Input
                            value={formData.owner_name || ""}
                            onChange={(e) => handleSettingChange('owner_name', e.target.value)}
                            placeholder="Seu nome completo"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Telefone</label>
                          <Input
                            value={formData.phone || ""}
                            onChange={(e) => handleSettingChange('phone', e.target.value)}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Endereço</label>
                        <Input
                          value={formData.address || ""}
                          onChange={(e) => handleSettingChange('address', e.target.value)}
                          placeholder="Rua, número - Cidade, Estado"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">CNPJ</label>
                        <Input
                          value={formData.cnpj || ""}
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
                          value={formData.whatsapp_number || ""}
                          onChange={(e) => handleSettingChange('whatsapp_number', e.target.value)}
                          placeholder="+55 11 99999-9999"
                        />
                        <p className="text-xs text-muted-foreground">
                          Número que será usado para atendimento automático
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                        <Textarea
                          value={formData.welcome_message || ""}
                          onChange={(e) => handleSettingChange('welcome_message', e.target.value)}
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
                            checked={formData.auto_reply ?? true}
                            onCheckedChange={(checked) => handleSettingChange('auto_reply', checked)}
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
                            checked={formData.business_hours ?? true}
                            onCheckedChange={(checked) => handleSettingChange('business_hours', checked)}
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
                          value={formData.ai_personality || "professional"}
                          onValueChange={(value) => handleSettingChange('ai_personality', value)}
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
                          value={(formData.response_delay ?? 2).toString()}
                          onValueChange={(value) => handleSettingChange('response_delay', parseInt(value))}
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
                          value={(formData.escalation_keywords || []).join(', ')}
                          onChange={(e) => handleSettingChange('escalation_keywords', e.target.value.split(', '))}
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
                            checked={formData.email_notifications ?? true}
                            onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
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
                            checked={formData.sms_notifications ?? false}
                            onCheckedChange={(checked) => handleSettingChange('sms_notifications', checked)}
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
                            checked={formData.push_notifications ?? true}
                            onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
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
                            checked={formData.notify_new_customer ?? true}
                            onCheckedChange={(checked) => handleSettingChange('notify_new_customer', checked)}
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
                            checked={formData.notify_missed_message ?? true}
                            onCheckedChange={(checked) => handleSettingChange('notify_missed_message', checked)}
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
                            value={formData.api_key || ""}
                            onChange={(e) => handleSettingChange('api_key', e.target.value)}
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
                          checked={formData.two_factor_auth ?? false}
                          onCheckedChange={(checked) => handleSettingChange('two_factor_auth', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Timeout da Sessão (horas)</label>
                        <Select
                          value={(formData.session_timeout ?? 8).toString()}
                          onValueChange={(value) => handleSettingChange('session_timeout', parseInt(value))}
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