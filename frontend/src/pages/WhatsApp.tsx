import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, CheckCircle, WifiOff, RefreshCw, MessageSquare } from "lucide-react";
import { useGlobalToast } from "@/hooks/useEnhancedToast";
import axios from "axios";
import { supabase } from "@/integrations/supabase/client";

// Configure axios with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
        const organizationId = session.user?.user_metadata?.organization_id ||
                              '00000000-0000-0000-0000-000000000001';
        if (organizationId) {
          config.headers['x-organization-id'] = organizationId;
        }
      }
    } catch (error) {
      console.warn('Failed to get session:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface WhatsAppStatus {
  status: 'connected' | 'disconnected' | 'waiting_qr' | 'connecting';
  needsQR: boolean;
  lastUpdate: string;
}

const WhatsApp = () => {
  const activeMenuItem = useActiveNavigation();
  const toast = useGlobalToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Buscar status inicial
  const fetchStatus = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      const data = response.data.data;
      setStatus(data);

      // Se estiver aguardando QR, buscar o código
      if (data.status === 'waiting_qr' || data.needsQR) {
        await fetchQRCode();
      } else {
        setQrCode(null);
      }
    } catch (error: any) {
      console.error('Error fetching status:', error);
      // Se der erro, assumir desconectado
      setStatus({
        status: 'disconnected',
        needsQR: false,
        lastUpdate: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar QR code
  const fetchQRCode = async () => {
    try {
      const response = await api.get('/whatsapp/qrcode');
      const data = response.data.data;

      if (data.available && data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
    }
  };

  // Conectar WhatsApp
  const handleConnect = async () => {
    try {
      setConnecting(true);
      console.log('Iniciando conexão WhatsApp...');

      const response = await api.post('/whatsapp/connect');
      const data = response.data.data;

      console.log('Resposta do servidor:', {
        hasQrCode: !!data.qrCode,
        qrCodeLength: data.qrCode?.length,
        qrCodePrefix: data.qrCode?.substring(0, 30),
        status: data.status
      });

      if (data.qrCode) {
        // Validar se QR Code está em formato correto
        if (!data.qrCode.startsWith('data:image')) {
          console.error('QR Code em formato inválido:', data.qrCode.substring(0, 50));
          toast.error('Erro no QR Code', 'QR Code em formato inválido. Contate o suporte.');
          return;
        }

        setQrCode(data.qrCode);
        setStatus({
          status: 'waiting_qr',
          needsQR: true,
          lastUpdate: new Date().toISOString()
        });

        // Iniciar polling para verificar conexão
        startPolling();

        toast.success('QR Code gerado!', 'Escaneie com seu WhatsApp para conectar');
      } else if (data.status === 'connected') {
        setStatus({
          status: 'connected',
          needsQR: false,
          lastUpdate: new Date().toISOString()
        });
        toast.success('WhatsApp conectado!', 'Sua conta está sincronizada');
      } else {
        console.warn('Resposta inesperada do servidor:', data);
        toast.error('Erro ao gerar QR Code', 'Nenhum QR Code foi retornado pelo servidor');
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Erro ao conectar', error.response?.data?.message || 'Tente novamente');
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      await api.post('/whatsapp/disconnect');
      setStatus({
        status: 'disconnected',
        needsQR: false,
        lastUpdate: new Date().toISOString()
      });
      setQrCode(null);
      stopPolling();
      toast.success('WhatsApp desconectado', 'Você pode reconectar a qualquer momento');
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar', 'Tente novamente');
    }
  };

  // Polling para verificar conexão
  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/whatsapp/status');
        const data = response.data.data;
        setStatus(data);

        if (data.status === 'connected') {
          toast.success('WhatsApp conectado!', 'Sua conta está sincronizada');
          setQrCode(null);
          stopPolling();
        } else if (data.status === 'waiting_qr' || data.needsQR) {
          // Tentar buscar QR code atualizado
          await fetchQRCode();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll a cada 5 segundos

    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, []);

  const getStatusBadge = () => {
    if (!status) return null;

    switch (status.status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'waiting_qr':
      case 'connecting':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Aguardando Conexão
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)]">
          <Sidebar activeItem={activeMenuItem} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verificando conexão WhatsApp...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem="whatsapp" />

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  WhatsApp Business
                </h1>
                <p className="text-muted-foreground">
                  Conecte seu WhatsApp para atendimento automatizado com IA
                </p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Status da Conexão
                </CardTitle>
                <CardDescription>
                  {status?.status === 'connected'
                    ? 'Seu WhatsApp está conectado e funcionando'
                    : 'Conecte seu WhatsApp para começar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status?.status === 'disconnected' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="flex justify-center">
                      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageSquare className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Conecte seu WhatsApp</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Escaneie o QR code com seu WhatsApp para conectar sua conta
                      </p>
                      <Button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando QR Code...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            Gerar QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {(status?.status === 'waiting_qr' || status?.status === 'connecting') && (
                  <div className="text-center py-8 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Escaneie o QR Code</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Abra o WhatsApp no seu celular e escaneie o código abaixo
                      </p>
                    </div>

                    {qrCode ? (
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border-2 border-border inline-block">
                          <img
                            src={qrCode}
                            alt="QR Code WhatsApp"
                            className="w-64 h-64"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem do QR Code');
                              toast.error('Erro ao exibir QR Code', 'Tente gerar um novo código');
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 inline-block">
                          <div className="w-64 h-64 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Como escanear:</strong>
                      </p>
                      <ol className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                        <li>1. Abra o WhatsApp no seu celular</li>
                        <li>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                        <li>3. Toque em <strong>Aparelhos conectados</strong></li>
                        <li>4. Toque em <strong>Conectar um aparelho</strong></li>
                        <li>5. Aponte seu celular para esta tela para escanear o código</li>
                      </ol>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleConnect}
                      disabled={connecting}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar Novo QR Code
                    </Button>
                  </div>
                )}

                {status?.status === 'connected' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="flex justify-center">
                      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-green-700">
                        WhatsApp Conectado com Sucesso! 🎉
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Seu WhatsApp está sincronizado e pronto para receber mensagens
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDisconnect}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <WifiOff className="h-4 w-4 mr-2" />
                        Desconectar WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Cards */}
            {status?.status !== 'connected' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">🤖</div>
                      <h4 className="font-semibold text-sm">IA Automática</h4>
                      <p className="text-xs text-muted-foreground">
                        Respostas automáticas com inteligência artificial
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">📅</div>
                      <h4 className="font-semibold text-sm">Agendamentos</h4>
                      <p className="text-xs text-muted-foreground">
                        Agende consultas automaticamente via WhatsApp
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">📊</div>
                      <h4 className="font-semibold text-sm">Analytics</h4>
                      <p className="text-xs text-muted-foreground">
                        Acompanhe métricas e performance em tempo real
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WhatsApp;
