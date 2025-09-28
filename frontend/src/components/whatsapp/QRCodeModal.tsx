import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Smartphone,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  QrCode,
  Phone,
  Camera
} from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName: string;
  onConnectionSuccess: () => void;
}

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_generated'
  | 'qr_scanned'
  | 'connected'
  | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  qrCode: string;
  message: string;
  phoneNumber?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onOpenChange,
  instanceName,
  onConnectionSuccess,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    qrCode: '',
    message: 'Inicializando conexão...'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Conectar instância e obter QR Code
  const connectInstance = async () => {
    try {
      setConnectionState(prev => ({
        ...prev,
        status: 'connecting',
        message: 'Conectando ao WhatsApp...'
      }));

      const response = await fetch(`/api/evolution/instance/${instanceName}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar instância');
      }

      const data = await response.json();

      if (data.success && data.data.qrCode) {
        setConnectionState({
          status: 'qr_generated',
          qrCode: data.data.qrCode,
          message: 'QR Code gerado! Escaneie com seu WhatsApp'
        });
        setCountdown(30); // QR Code expira em 30 segundos
      } else {
        throw new Error(data.message || 'QR Code não disponível');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionState({
        status: 'error',
        qrCode: '',
        message: error instanceof Error ? error.message : 'Erro de conexão'
      });

      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar ao WhatsApp. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/evolution/instance/${instanceName}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const { connectionState: state, phoneNumber } = data.data;

        if (state === 'open' || state === 'connected') {
          setConnectionState({
            status: 'connected',
            qrCode: '',
            message: `WhatsApp conectado com sucesso!`,
            phoneNumber: phoneNumber
          });

          toast({
            title: "WhatsApp Conectado! 🎉",
            description: `Sua conta está sincronizada e pronta para uso`,
          });

          setTimeout(() => {
            onConnectionSuccess();
            onOpenChange(false);
          }, 2000);
        } else if (state === 'qr') {
          // QR Code ainda ativo, manter status atual
        } else if (state === 'connecting') {
          setConnectionState(prev => ({
            ...prev,
            status: 'qr_scanned',
            message: 'QR Code escaneado! Finalizando conexão...'
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Obter novo QR Code
  const refreshQRCode = async () => {
    try {
      const response = await fetch(`/api/evolution/instance/${instanceName}/qr`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.available && data.data.qrCode) {
          setConnectionState(prev => ({
            ...prev,
            qrCode: data.data.qrCode,
            message: 'QR Code atualizado! Escaneie com seu WhatsApp'
          }));
          setCountdown(30);
        } else {
          // Se não há QR disponível, reconectar
          await connectInstance();
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar QR:', error);
      await connectInstance();
    }
  };

  // Efeitos
  useEffect(() => {
    if (open) {
      connectInstance();
    } else {
      setAutoRefresh(false);
      setConnectionState({
        status: 'disconnected',
        qrCode: '',
        message: 'Inicializando conexão...'
      });
    }
  }, [open]);

  // Auto-refresh do status
  useEffect(() => {
    if (!autoRefresh || !open) return;

    const interval = setInterval(() => {
      if (connectionState.status === 'qr_generated' || connectionState.status === 'qr_scanned') {
        checkConnectionStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, open, connectionState.status]);

  // Countdown do QR Code
  useEffect(() => {
    if (countdown > 0 && connectionState.status === 'qr_generated') {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && connectionState.status === 'qr_generated') {
      refreshQRCode();
    }
  }, [countdown, connectionState.status]);

  const getStatusIcon = () => {
    switch (connectionState.status) {
      case 'connecting':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'qr_generated':
        return <QrCode className="h-6 w-6 text-blue-500" />;
      case 'qr_scanned':
        return <Loader2 className="h-6 w-6 animate-spin text-green-500" />;
      case 'connected':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Smartphone className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionState.status) {
      case 'connecting':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conectando</Badge>;
      case 'qr_generated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Aguardando Scan</Badge>;
      case 'qr_scanned':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Finalizando</Badge>;
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para conectar sua conta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{connectionState.message}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* QR Code */}
          {connectionState.status === 'qr_generated' && connectionState.qrCode && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm border">
                  <QRCodeSVG
                    value={connectionState.qrCode}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
                {countdown > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      Expira em {countdown}s
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading states */}
          {(connectionState.status === 'connecting' || connectionState.status === 'qr_scanned') && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {connectionState.status === 'connecting'
                    ? 'Inicializando conexão com WhatsApp...'
                    : 'Finalizando conexão... Isso pode levar alguns segundos.'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Success state */}
          {connectionState.status === 'connected' && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="font-medium text-green-700 mb-2">WhatsApp Conectado!</p>
                {connectionState.phoneNumber && (
                  <p className="text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 inline mr-1" />
                    {connectionState.phoneNumber}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {connectionState.status === 'error' && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="font-medium text-red-700 mb-2">Erro na Conexão</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {connectionState.message}
                </p>
                <Button onClick={connectInstance} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {connectionState.status === 'qr_generated' && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                <p>Abra o WhatsApp no seu celular</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                <p>Toque em "Mais opções" ou "Configurações"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                <p>Selecione "Aparelhos conectados" → "Conectar um aparelho"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                <p className="flex items-center gap-1">
                  Escaneie o QR Code <Camera className="h-4 w-4" />
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {connectionState.status === 'qr_generated' && (
              <Button onClick={refreshQRCode} variant="outline" size="sm" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Novo QR Code
              </Button>
            )}
            {connectionState.status === 'error' && (
              <Button onClick={connectInstance} variant="outline" size="sm" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconectar
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant={connectionState.status === 'connected' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              {connectionState.status === 'connected' ? 'Finalizar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};