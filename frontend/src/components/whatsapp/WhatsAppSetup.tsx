import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { QRCodeModal } from "./QRCodeModal";
import {
  Smartphone,
  Plus,
  Settings,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Bot,
  Users,
  Zap,
  Loader2,
  QrCode,
  Wifi,
  WifiOff
} from "lucide-react";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number?: string;
  status: string;
  is_connected: boolean;
  connection_status: string;
  last_heartbeat?: string;
  created_at: string;
  settings?: {
    auto_reply: boolean;
    ai_enabled: boolean;
    welcome_message: string;
    away_message: string;
    business_hours: {
      start: string;
      end: string;
      days: number[];
    };
  };
}

interface WhatsAppSetupProps {
  organizationId: string;
}

export const WhatsAppSetup: React.FC<WhatsAppSetupProps> = ({ organizationId }) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);

  // Carregar instâncias
  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/evolution/instances', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const instancesWithSettings = await Promise.all(
          data.data.map(async (instance: any) => {
            // Buscar configurações de cada instância
            try {
              const settingsResponse = await fetch(`/api/whatsapp/instance/${instance.instanceName}/settings`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
              });

              let settings = null;
              if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                settings = settingsData.data;
              }

              return {
                id: instance.instanceId,
                instance_name: instance.instanceName,
                phone_number: instance.phoneNumber,
                status: instance.status,
                is_connected: instance.connectionState === 'open',
                connection_status: instance.connectionState,
                settings
              };
            } catch (error) {
              console.error('Erro ao carregar configurações:', error);
              return {
                id: instance.instanceId,
                instance_name: instance.instanceName,
                status: instance.status,
                is_connected: false,
                connection_status: 'disconnected'
              };
            }
          })
        );

        setInstances(instancesWithSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as instâncias WhatsApp",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar nova instância
  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe um nome para a instância",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/evolution/instance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          businessId: newInstanceName.toLowerCase().replace(/[^a-z0-9]/g, '')
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Instância criada! 🎉",
          description: "Agora você pode conectar seu WhatsApp",
        });

        setNewInstanceName('');
        await loadInstances();

        // Abrir modal QR automaticamente
        setSelectedInstance(data.data.instanceName);
        setQrModalOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar instância');
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro na criação",
        description: error instanceof Error ? error.message : "Falha ao criar instância",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Conectar instância
  const connectInstance = (instanceName: string) => {
    setSelectedInstance(instanceName);
    setQrModalOpen(true);
  };

  // Desconectar instância
  const disconnectInstance = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/evolution/instance/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Instância desconectada",
          description: "WhatsApp foi desconectado com sucesso",
        });
        await loadInstances();
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar a instância",
        variant: "destructive"
      });
    }
  };

  // Reiniciar instância
  const restartInstance = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/evolution/instance/${instanceName}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Instância reiniciada",
          description: "WhatsApp foi reiniciado com sucesso",
        });
        await loadInstances();
      }
    } catch (error) {
      console.error('Erro ao reiniciar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reiniciar a instância",
        variant: "destructive"
      });
    }
  };

  // Atualizar configurações
  const updateInstanceSettings = async (instanceName: string, settings: any) => {
    try {
      const response = await fetch(`/api/whatsapp/instance/${instanceName}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Configurações salvas",
          description: "As configurações foram atualizadas com sucesso",
        });
        await loadInstances();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadInstances();

    // Auto-refresh das instâncias
    const interval = setInterval(loadInstances, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (instance: WhatsAppInstance) => {
    if (instance.is_connected) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Conectado
        </Badge>
      );
    }

    switch (instance.connection_status) {
      case 'connecting':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      case 'qr':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <QrCode className="h-3 w-3 mr-1" />
            Aguardando QR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            <WifiOff className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Conectando com os tutores... 📱🐾</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            WhatsApp Business
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões WhatsApp para atendimento automatizado
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {instances.filter(i => i.is_connected).length} de {instances.length} conectadas
        </Badge>
      </div>

      {/* Criar nova instância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Instância WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                placeholder="Ex: petshop-centro, filial-norte..."
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createInstance()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={createInstance}
                disabled={creating || !newInstanceName.trim()}
                className="bg-gradient-primary hover:bg-gradient-primary/90"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de instâncias */}
      <div className="grid gap-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhuma instância WhatsApp configurada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua primeira instância para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id} className="glass-morphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-green-200">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        <Smartphone className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-semibold">{instance.instance_name}</h3>
                      {instance.phone_number && (
                        <p className="text-sm text-muted-foreground">
                          📱 {instance.phone_number}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(instance)}
                        {instance.settings?.ai_enabled && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            IA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!instance.is_connected ? (
                      <Button
                        onClick={() => connectInstance(instance.instance_name)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Wifi className="h-4 w-4 mr-1" />
                        Conectar
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => restartInstance(instance.instance_name)}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => disconnectInstance(instance.instance_name)}
                          variant="outline"
                          size="sm"
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => setSettingsOpen(settingsOpen === instance.id ? null : instance.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Configurações expandidas */}
                {settingsOpen === instance.id && instance.settings && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`auto-reply-${instance.id}`}>Auto-resposta</Label>
                        <Switch
                          id={`auto-reply-${instance.id}`}
                          checked={instance.settings.auto_reply}
                          onCheckedChange={(checked) =>
                            updateInstanceSettings(instance.instance_name, {
                              ...instance.settings,
                              auto_reply: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`ai-enabled-${instance.id}`}>IA Habilitada</Label>
                        <Switch
                          id={`ai-enabled-${instance.id}`}
                          checked={instance.settings.ai_enabled}
                          onCheckedChange={(checked) =>
                            updateInstanceSettings(instance.instance_name, {
                              ...instance.settings,
                              ai_enabled: checked
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Mensagem de Boas-vindas</Label>
                        <Textarea
                          value={instance.settings.welcome_message}
                          onChange={(e) =>
                            updateInstanceSettings(instance.instance_name, {
                              ...instance.settings,
                              welcome_message: e.target.value
                            })
                          }
                          placeholder="Mensagem automática para novos contatos..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Mensagem Fora do Horário</Label>
                        <Textarea
                          value={instance.settings.away_message}
                          onChange={(e) =>
                            updateInstanceSettings(instance.instance_name, {
                              ...instance.settings,
                              away_message: e.target.value
                            })
                          }
                          placeholder="Mensagem para horário não comercial..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal QR Code */}
      <QRCodeModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        instanceName={selectedInstance}
        onConnectionSuccess={() => {
          loadInstances();
          toast({
            title: "WhatsApp Conectado! 🎉",
            description: "Sua conta está sincronizada e pronta para receber mensagens",
          });
        }}
      />
    </div>
  );
};