import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { api } from '@/hooks/useApiData';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  MessageCircle,
  CheckCircle,
  Loader2,
  WifiOff,
  RefreshCw
} from 'lucide-react';

export const WhatsAppConnectionCard: React.FC = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Gerar QR code automaticamente ao montar
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Usar o endpoint correto da Evolution API v2
      const response = await api.get('/evolution/instance/auzap/qr');

      if (response.data.success) {
        const qr = response.data.data.qrCode;

        if (qr) {
          setQrCode(qr);
          setConnected(false);
          toast({
            title: 'QR Code Gerado! 📱',
            description: 'Escaneie com seu WhatsApp para conectar',
          });
        } else {
          // Já conectado
          setConnected(true);
          toast({
            title: 'WhatsApp Conectado! ✅',
            description: 'Sua instância está pronta para uso!',
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR code:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao conectar WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/disconnect');
      setConnected(false);
      setQrCode('');

      toast({
        title: 'WhatsApp Desconectado',
        description: 'Você pode reconectar quando quiser',
      });
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[20px] bg-card border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold">
            {connected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <MessageCircle className="h-5 w-5 text-gray-400" />
            )}
            WhatsApp Business
          </CardTitle>
          <Badge
            variant={connected ? "default" : "outline"}
            className={connected ? "bg-green-100 text-green-700 border-green-200 text-xs" : "bg-gray-50 text-gray-600 text-xs"}
          >
            {connected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : connected ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h3 className="font-medium text-sm">WhatsApp Conectado! ✅</h3>
              <p className="text-xs text-muted-foreground text-center">
                Pronto para receber e enviar mensagens
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateQRCode}
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reconectar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <h3 className="font-medium text-sm text-center">Escaneie o QR Code</h3>
              <p className="text-xs text-muted-foreground text-center">
                Abra o WhatsApp no celular e escaneie este código
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeDisplay value={qrCode} size={200} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                WhatsApp → ⋮ → Aparelhos conectados → Conectar
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={generateQRCode}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Gerar Novo QR Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <WifiOff className="h-12 w-12 text-gray-400" />
              <h3 className="font-medium text-sm">WhatsApp Desconectado</h3>
              <p className="text-xs text-muted-foreground text-center">
                Conecte para receber mensagens automaticamente
              </p>
            </div>
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={generateQRCode}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Conectar WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
