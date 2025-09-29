import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { WhatsAppConnection } from './WhatsAppConnection';
import { api } from '@/hooks/useApiData';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle,
  CheckCircle,
  Loader2,
  WifiOff,
  Phone,
  Settings
} from 'lucide-react';

type WhatsAppStatus = 'connected' | 'connecting' | 'disconnected' | 'waiting_qr';

interface WhatsAppStatusData {
  status: WhatsAppStatus;
  needsQR: boolean;
  phoneNumber?: string;
  instanceName?: string;
  lastUpdate: string;
}

export const WhatsAppConnectionCard: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [showFullComponent, setShowFullComponent] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkWhatsAppStatus();
    setupWebSocket();

    const interval = setInterval(checkWhatsAppStatus, 30000); // Verificar a cada 30 segundos (reduzido pois temos WebSocket)

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const setupWebSocket = () => {
    const newSocket = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected for WhatsApp status');
      // Entrar na organização
      newSocket.emit('join_organization', 'default'); // Por enquanto usando default
    });

    newSocket.on('user_whatsapp_status', (data) => {
      console.log('Received WhatsApp status update:', data);
      setStatus(data.status);

      if (data.data?.phoneNumber) {
        setPhoneNumber(data.data.phoneNumber);
      }

      // Mostrar toast para mudanças importantes
      if (data.status === 'connected') {
        toast({
          title: 'WhatsApp Conectado! 🎉',
          description: 'Pronto para receber mensagens',
        });
        // Fechar modal quando conectar com sucesso
        setConnecting(false);
        setTimeout(() => {
          setShowFullComponent(false);
        }, 2000);
      } else if (data.status === 'disconnected' && !connecting) {
        toast({
          title: 'WhatsApp Desconectado',
          description: 'Você pode reconectar a qualquer momento',
          variant: 'destructive'
        });
      } else if (data.status === 'connecting' || data.status === 'waiting_qr') {
        setConnecting(true);
      }
    });

    newSocket.on('whatsapp_status', (data) => {
      // Evento geral de WhatsApp (para compatibilidade)
      if (data.instanceName && data.instanceName.includes('user_')) {
        setStatus(data.status);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    setSocket(newSocket);
  };

  const checkWhatsAppStatus = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      const { data }: { data: WhatsAppStatusData } = response.data;
      setStatus(data.status);
      setPhoneNumber(data.phoneNumber || '');
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              Conectado
            </Badge>
          ),
          title: 'WhatsApp Conectado',
          description: phoneNumber ? `📱 ${phoneNumber}` : 'Pronto para receber mensagens',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullComponent(true)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          )
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
          badge: (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
              Conectando
            </Badge>
          ),
          title: 'Conectando WhatsApp',
          description: 'Preparando conexão...',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullComponent(true)}
            >
              Ver QR Code
            </Button>
          )
        };
      case 'waiting_qr':
        return {
          icon: <Phone className="h-5 w-5 text-yellow-600" />,
          badge: (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
              Aguardando QR
            </Badge>
          ),
          title: 'Escaneie o QR Code',
          description: 'Abra o WhatsApp e escaneie o código',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullComponent(true)}
            >
              Ver QR Code
            </Button>
          )
        };
      default:
        return {
          icon: <WifiOff className="h-5 w-5 text-gray-400" />,
          badge: (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
              Desconectado
            </Badge>
          ),
          title: 'WhatsApp Desconectado',
          description: 'Conecte para receber mensagens automaticamente',
          action: (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowFullComponent(true);
                setConnecting(false); // Reset connecting state
              }}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Conectar
            </Button>
          )
        };
    }
  };

  if (checking) {
    return (
      <Card className="rounded-[20px] bg-card border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <h3 className="font-medium text-sm">Verificando WhatsApp...</h3>
              <p className="text-xs text-muted-foreground">Aguarde um momento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo();

  if (showFullComponent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Configurar WhatsApp</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Só permite fechar se não estiver conectando
                if (!connecting && status !== 'connecting' && status !== 'waiting_qr') {
                  setShowFullComponent(false);
                } else {
                  toast({
                    title: 'Conexão em andamento',
                    description: 'Aguarde a conexão finalizar ou seja concluída',
                    variant: 'default'
                  });
                }
              }}
            >
              ✕
            </Button>
          </div>
          <div className="p-4">
            <WhatsAppConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-[20px] bg-card border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold">
            {statusInfo.icon}
            WhatsApp Business
          </CardTitle>
          {statusInfo.badge}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm text-foreground">
              {statusInfo.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>
          <div className="flex justify-end">
            {statusInfo.action}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};