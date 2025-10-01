import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Shield,
  Database,
  Mail,
  Bell,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface SystemSettings {
  general: {
    site_name: string;
    site_url: string;
    support_email: string;
    max_file_size_mb: number;
  };
  security: {
    enable_2fa: boolean;
    session_timeout_minutes: number;
    password_min_length: number;
    password_require_special: boolean;
    max_login_attempts: number;
    lockout_duration_minutes: number;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_from_name: string;
    smtp_from_email: string;
  };
  whatsapp: {
    evolution_api_url: string;
    evolution_api_key: string;
    webhook_url: string;
    max_instances_per_org: number;
  };
  ai: {
    openai_api_key: string;
    default_model: string;
    max_tokens: number;
    temperature: number;
  };
  notifications: {
    enable_email_notifications: boolean;
    enable_push_notifications: boolean;
    enable_sms_notifications: boolean;
  };
}

export default function SystemSettings() {
  const { toast } = useToast();
  const {
    settings: apiSettings,
    isLoading,
    updateSettings,
    testEmail,
    testWhatsApp,
    isUpdating,
    isTesting
  } = useSystemSettings();

  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      site_name: 'Auzap.ai',
      site_url: 'https://auzap.ai',
      support_email: 'support@auzap.ai',
      max_file_size_mb: 10,
    },
    security: {
      enable_2fa: true,
      session_timeout_minutes: 60,
      password_min_length: 8,
      password_require_special: true,
      max_login_attempts: 5,
      lockout_duration_minutes: 15,
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_from_name: 'Auzap.ai',
      smtp_from_email: 'noreply@auzap.ai',
    },
    whatsapp: {
      evolution_api_url: import.meta.env.VITE_EVOLUTION_API_URL || '',
      evolution_api_key: '',
      webhook_url: '',
      max_instances_per_org: 3,
    },
    ai: {
      openai_api_key: '',
      default_model: 'gpt-4',
      max_tokens: 1000,
      temperature: 0.7,
    },
    notifications: {
      enable_email_notifications: true,
      enable_push_notifications: false,
      enable_sms_notifications: false,
    },
  });

  // Load settings from API when available
  useEffect(() => {
    if (apiSettings) {
      setSettings((prev) => ({
        ...prev,
        ...apiSettings
      }));
    }
  }, [apiSettings]);

  const handleSave = async () => {
    try {
      await updateSettings(settings);
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleTestEmail = async () => {
    try {
      await testEmail(settings.email);
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      await testWhatsApp(settings.whatsapp);
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleReset = () => {
    if (apiSettings) {
      setSettings((prev) => ({
        ...prev,
        ...apiSettings
      }));
      toast({
        title: 'Configurações resetadas',
        description: 'As configurações foram revertidas para os valores salvos.',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Configure as definições globais da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || isLoading}>
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <Database className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Zap className="h-4 w-4 mr-2" />
            IA
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure informações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Nome do Site</Label>
                <Input
                  id="site_name"
                  value={settings.general.site_name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, site_name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_url">URL do Site</Label>
                <Input
                  id="site_url"
                  type="url"
                  value={settings.general.site_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, site_url: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_email">Email de Suporte</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.general.support_email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, support_email: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_file_size">Tamanho Máximo de Arquivo (MB)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  value={settings.general.max_file_size_mb}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        max_file_size_mb: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure políticas de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Requer 2FA para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={settings.security.enable_2fa}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, enable_2fa: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Timeout de Sessão (minutos)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.security.session_timeout_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        session_timeout_minutes: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_min_length">Comprimento Mínimo da Senha</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  value={settings.security.password_min_length}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        password_min_length: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Caracteres Especiais</Label>
                  <p className="text-sm text-muted-foreground">
                    Senha deve conter caracteres especiais
                  </p>
                </div>
                <Switch
                  checked={settings.security.password_require_special}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, password_require_special: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_login_attempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  value={settings.security.max_login_attempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        max_login_attempts: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockout_duration">Duração do Bloqueio (minutos)</Label>
                <Input
                  id="lockout_duration"
                  type="number"
                  value={settings.security.lockout_duration_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        lockout_duration_minutes: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>Configure o servidor SMTP para envio de emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={settings.email.smtp_host}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtp_host: e.target.value },
                    })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.email.smtp_port}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtp_port: parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_user">SMTP User</Label>
                <Input
                  id="smtp_user"
                  value={settings.email.smtp_user}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtp_user: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_from_name">Nome do Remetente</Label>
                <Input
                  id="smtp_from_name"
                  value={settings.email.smtp_from_name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtp_from_name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_from_email">Email do Remetente</Label>
                <Input
                  id="smtp_from_email"
                  type="email"
                  value={settings.email.smtp_from_email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtp_from_email: e.target.value },
                    })
                  }
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleTestEmail}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Testar Configuração de Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações WhatsApp (Evolution API)</CardTitle>
              <CardDescription>
                Configure a integração com a Evolution API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evolution_api_url">Evolution API URL</Label>
                <Input
                  id="evolution_api_url"
                  value={settings.whatsapp.evolution_api_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, evolution_api_url: e.target.value },
                    })
                  }
                  placeholder="https://api.evolution.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evolution_api_key">Evolution API Key</Label>
                <Input
                  id="evolution_api_key"
                  type="password"
                  value={settings.whatsapp.evolution_api_key}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, evolution_api_key: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={settings.whatsapp.webhook_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, webhook_url: e.target.value },
                    })
                  }
                  placeholder="https://auzap.ai/webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_instances">
                  Máximo de Instâncias por Organização
                </Label>
                <Input
                  id="max_instances"
                  type="number"
                  value={settings.whatsapp.max_instances_per_org}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        max_instances_per_org: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleTestWhatsApp}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Testar Conexão com Evolution API
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de IA</CardTitle>
              <CardDescription>Configure a integração com OpenAI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                <Input
                  id="openai_api_key"
                  type="password"
                  value={settings.ai.openai_api_key}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, openai_api_key: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_model">Modelo Padrão</Label>
                <Input
                  id="default_model"
                  value={settings.ai.default_model}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, default_model: e.target.value },
                    })
                  }
                  placeholder="gpt-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={settings.ai.max_tokens}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, max_tokens: parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (0-1)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={settings.ai.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, temperature: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <Button variant="outline" className="w-full" disabled>
                <Zap className="h-4 w-4 mr-2" />
                Testar Integração OpenAI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure os canais de notificação do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações importantes por email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enable_email_notifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enable_email_notifications: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações push no navegador
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enable_push_notifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enable_push_notifications: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações críticas por SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enable_sms_notifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enable_sms_notifications: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
