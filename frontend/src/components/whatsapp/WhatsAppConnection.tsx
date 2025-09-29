import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  MessageCircle,
  Phone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Power
} from 'lucide-react';

type WhatsAppStatus = 'connected' | 'connecting' | 'disconnected' | 'waiting_qr';

interface WhatsAppStatusData {
  status: WhatsAppStatus;
  needsQR: boolean;
  phoneNumber?: string;
  instanceName?: string;
  lastUpdate: string;
}

interface ConnectionResult {
  qrCode?: string;
  message: string;
}

export const WhatsAppConnection: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string>('');

  // Verificar status periodicamente
  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const { data }: { data: WhatsAppStatusData } = await response.json();
        setStatus(data.status);
        setPhoneNumber(data.phoneNumber || '');
        setError('');

        // Se status mudou para connected, limpar QR code
        if (data.status === 'connected') {
          setQrCode('');
        }

        // Se precisa de QR e não temos um, buscar
        if (data.needsQR && !qrCode && data.status === 'waiting_qr') {
          fetchQRCode();
        }
      } else {
        setError('Erro ao verificar status do WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setError('Falha na conexão com o servidor');
    } finally {
      setChecking(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await fetch('/api/whatsapp/qrcode', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        if (data.available && data.qrCode) {
          setQrCode(data.qrCode);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar QR code:', error);
    }
  };

  const connectWhatsApp = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('connecting');

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const { data }: { data: ConnectionResult } = await response.json();

        if (data.qrCode) {
          setQrCode(data.qrCode);
          setStatus('waiting_qr');
          toast({
            title: 'QR Code gerado!',
            description: 'Escaneie o código com seu WhatsApp para conectar',
          });
        } else {
          toast({
            title: 'Conectando...',
            description: data.message,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao conectar WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      setError(error instanceof Error ? error.message : 'Falha ao conectar WhatsApp');
      setStatus('disconnected');
      toast({
        title: 'Erro na conexão',
        description: error instanceof Error ? error.message : 'Falha ao conectar WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setStatus('disconnected');
        setQrCode('');
        setPhoneNumber('');
        toast({
          title: 'WhatsApp desconectado',
          description: 'Você pode reconectar a qualquer momento',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao desconectar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setChecking(true);
    await checkWhatsAppStatus();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      case 'waiting_qr':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Phone className="h-3 w-3 mr-1" />
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

  if (checking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Verificando status do WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Business
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStatus}
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Estado: Desconectado */}
          {status === 'disconnected' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp Desconectado</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Conecte seu WhatsApp para começar a receber e enviar mensagens automaticamente
              </p>
              <Button
                onClick={connectWhatsApp}
                disabled={loading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 h-4 w-4" />
                )}
                Conectar WhatsApp
              </Button>
            </div>
          )}

          {/* Estado: Conectando */}
          {status === 'connecting' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Preparando Conexão</h3>
              <p className="text-gray-600 text-sm">
                Aguarde enquanto preparamos tudo para você...
              </p>
            </div>
          )}

          {/* Estado: Aguardando QR Code */}
          {status === 'waiting_qr' && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>

              {qrCode ? (
                <div className="space-y-4">
                  <QRCodeDisplay value={qrCode} size={200} />

                  <div className="text-left text-sm text-gray-600 space-y-1">
                    <p className="font-medium">Como conectar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Toque em ⋯ (Menu) ou Configurações</li>
                      <li>Toque em "Aparelhos conectados"</li>
                      <li>Toque em "Conectar um aparelho"</li>
                      <li>Escaneie este código</li>
                    </ol>
                  </div>

                  <Button
                    variant="outline"
                    onClick={fetchQRCode}
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar Novo QR Code
                  </Button>
                </div>
              ) : (
                <div className="py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              )}
            </div>
          )}

          {/* Estado: Conectado */}
          {status === 'connected' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-700">
                WhatsApp Conectado!
              </h3>
              {phoneNumber && (
                <p className="text-gray-600 mb-4">
                  📱 {phoneNumber}
                </p>
              )}
              <p className="text-gray-600 mb-6 text-sm">
                Pronto para receber mensagens dos seus clientes
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={refreshStatus}
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnectWhatsApp}
                  disabled={loading}
                  size="sm"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="mr-2 h-4 w-4" />
                  )}
                  Desconectar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      {status === 'connected' && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Wifi className="h-4 w-4 text-green-500" />
              <span>
                Conexão estabelecida e monitorada em tempo real
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};