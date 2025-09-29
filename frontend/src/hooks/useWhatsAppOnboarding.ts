import { useState, useCallback } from 'react';
import { api } from './useApiData';

export interface QRCodeData {
  code: string;
  base64: string;
}

export interface ConnectionStatus {
  state: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  instance?: {
    id: string;
    name: string;
    phone?: string;
  };
  error?: string;
}

export function useWhatsAppOnboarding() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'disconnected'
  });

  /**
   * Inicia o processo de conexão do WhatsApp
   * Cria uma instância e retorna o QR Code
   */
  const startConnection = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus({ state: 'connecting' });

      // Chamar endpoint backend para criar instância e gerar QR Code
      const response = await api.post('/whatsapp/connect');

      if (response.data.success && response.data.qrCode) {
        setQrCode({
          code: response.data.qrCode.code,
          base64: response.data.qrCode.base64
        });

        setConnectionStatus({
          state: 'qr_ready',
          instance: {
            id: response.data.instance.id,
            name: response.data.instance.name
          }
        });

        // Iniciar polling do status da conexão
        pollConnectionStatus(response.data.instance.id);
      } else {
        throw new Error(response.data.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar conexão WhatsApp:', error);
      setConnectionStatus({
        state: 'error',
        error: error.response?.data?.error || error.message || 'Erro desconhecido'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [api]);

  /**
   * Monitora o status da conexão via polling
   */
  const pollConnectionStatus = useCallback(async (instanceId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 segundos (1 minuto)

    const poll = setInterval(async () => {
      try {
        attempts++;

        const response = await api.get(`/whatsapp/status/${instanceId}`);
        const status = response.data.data;

        if (status.state === 'open') {
          // Conexão estabelecida com sucesso!
          setConnectionStatus({
            state: 'connected',
            instance: {
              id: instanceId,
              name: status.instanceName,
              phone: status.instance?.wuid
            }
          });
          clearInterval(poll);
        } else if (attempts >= maxAttempts) {
          // Timeout - QR Code expirou
          setConnectionStatus({
            state: 'error',
            error: 'QR Code expirou. Tente novamente.'
          });
          clearInterval(poll);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        clearInterval(poll);
        setConnectionStatus({
          state: 'error',
          error: 'Erro ao verificar status da conexão'
        });
      }
    }, 1000); // Verificar a cada 1 segundo

    return () => clearInterval(poll);
  }, [api]);

  /**
   * Cancela o processo de conexão
   */
  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setQrCode(null);
    setConnectionStatus({ state: 'disconnected' });
  }, []);

  /**
   * Reinicia o processo (novo QR Code)
   */
  const restartConnection = useCallback(() => {
    setQrCode(null);
    setConnectionStatus({ state: 'disconnected' });
    startConnection();
  }, [startConnection]);

  return {
    // Estado
    isConnecting,
    qrCode,
    connectionStatus,

    // Ações
    startConnection,
    cancelConnection,
    restartConnection,

    // Status helpers
    isQRReady: connectionStatus.state === 'qr_ready',
    isConnected: connectionStatus.state === 'connected',
    hasError: connectionStatus.state === 'error'
  };
}