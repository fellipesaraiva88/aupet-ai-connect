import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { useWhatsAppOnboarding, ConnectionStatus } from '@/hooks/useWhatsAppOnboarding';

interface WhatsAppQRCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (instanceId: string) => void;
}

export const WhatsAppQRCodeModal: React.FC<WhatsAppQRCodeModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const {
    isConnecting,
    qrCode,
    connectionStatus,
    startConnection,
    cancelConnection,
    restartConnection,
    isQRReady,
    isConnected,
    hasError
  } = useWhatsAppOnboarding();

  // Iniciar conexão quando o modal abre
  useEffect(() => {
    if (open && connectionStatus.state === 'disconnected') {
      startConnection();
    }
  }, [open]);

  // Callback quando conectar com sucesso
  useEffect(() => {
    if (isConnected && connectionStatus.instance) {
      setTimeout(() => {
        onSuccess?.(connectionStatus.instance!.id);
        handleClose();
      }, 2000);
    }
  }, [isConnected, connectionStatus.instance, onSuccess]);

  const handleClose = () => {
    cancelConnection();
    onClose();
  };

  const renderConnectionSteps = () => (
    <div className="space-y-4 mt-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">1</span>
        </div>
        <div>
          <p className="font-medium">Abra o WhatsApp no seu celular</p>
          <p className="text-sm text-muted-foreground">
            No Android: Menu → Aparelhos conectados
          </p>
          <p className="text-sm text-muted-foreground">
            No iPhone: Ajustes → Aparelhos conectados
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">2</span>
        </div>
        <div>
          <p className="font-medium">Toque em "Conectar um aparelho"</p>
          <p className="text-sm text-muted-foreground">
            Você precisará desbloquear o celular se solicitado
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">3</span>
        </div>
        <div>
          <p className="font-medium">Aponte seu celular para esta tela</p>
          <p className="text-sm text-muted-foreground">
            O QR Code será lido automaticamente
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Estado: Conectando
    if (isConnecting || connectionStatus.state === 'connecting') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preparando conexão...</h3>
          <p className="text-sm text-muted-foreground">
            Gerando QR Code e configurando instância
          </p>
        </motion.div>
      );
    }

    // Estado: QR Code pronto
    if (isQRReady && qrCode) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-primary/20">
              <img
                src={qrCode.base64}
                alt="QR Code WhatsApp"
                className="w-64 h-64"
              />
            </div>
          </div>

          {/* Status */}
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Aguardando leitura do QR Code... Aponte a câmera do seu celular para conectar.
            </AlertDescription>
          </Alert>

          {/* Instruções */}
          {renderConnectionSteps()}

          {/* Botão de renovar QR Code */}
          <Button
            variant="outline"
            className="w-full"
            onClick={restartConnection}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar novo QR Code
          </Button>
        </motion.div>
      );
    }

    // Estado: Conectado
    if (isConnected) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Conectado com sucesso!
          </h3>
          <p className="text-muted-foreground">
            {connectionStatus.instance?.phone
              ? `WhatsApp conectado: ${connectionStatus.instance.phone}`
              : 'Seu WhatsApp foi vinculado ao Auzap'}
          </p>
        </motion.div>
      );
    }

    // Estado: Erro
    if (hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            Erro na conexão
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {connectionStatus.error || 'Não foi possível conectar ao WhatsApp'}
          </p>
          <Button onClick={restartConnection} className="mx-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            Conectar WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta WhatsApp Business para começar a usar a IA Auzap
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        {/* Botão de fechar */}
        {!isConnected && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};