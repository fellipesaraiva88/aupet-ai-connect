import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { HandoffToggle } from './HandoffToggle';
import { AIStatusIndicator } from './AIStatusIndicator';
import { History, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HandoffControlProps {
  conversationId: string;
  currentHandler: 'ai' | 'human' | 'queue';
  aiEnabled: boolean;
  needsAttention: boolean;
  onHandoffChange?: (conversationId: string, newHandler: 'ai' | 'human') => void;
}

export const HandoffControl: React.FC<HandoffControlProps> = ({
  conversationId,
  currentHandler,
  aiEnabled,
  needsAttention,
  onHandoffChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [handoffHistory, setHandoffHistory] = useState<any[]>([]);
  const [aiStatus, setAIStatus] = useState<'ai' | 'human' | 'analyzing' | 'generating'>('ai');

  // Load handoff history
  const loadHistory = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/handoff/${conversationId}/history?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandoffHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error loading handoff history:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, conversationId]);

  // Listen to WebSocket events for AI status updates
  useEffect(() => {
    // TODO: Implement WebSocket listener for 'ai:responding' events
    // This will update aiStatus to 'analyzing', 'generating', etc.
  }, [conversationId]);

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      const endpoint = enabled ? 'enable' : 'disable';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/handoff/${conversationId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle handoff');
      }

      const newHandler = enabled ? 'ai' : 'human';

      toast({
        title: enabled ? '🤖 IA Ativada' : '👤 Atendimento Humano',
        description: enabled
          ? 'A IA voltou a responder automaticamente nesta conversa'
          : 'Você está agora no controle desta conversa'
      });

      onHandoffChange?.(conversationId, newHandler);
    } catch (error) {
      console.error('Error toggling handoff:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o modo de atendimento',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToHuman = async () => {
    if (!transferReason.trim()) {
      toast({
        title: 'Motivo necessário',
        description: 'Por favor, informe o motivo da transferência',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/handoff/${conversationId}/transfer-to-human`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            reason: transferReason,
            notifyCustomer: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to transfer to human');
      }

      toast({
        title: '✅ Transferido para Atendimento Humano',
        description: 'O cliente foi notificado sobre a transferência'
      });

      setShowTransferDialog(false);
      setTransferReason('');
      onHandoffChange?.(conversationId, 'human');
    } catch (error) {
      console.error('Error transferring to human:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível transferir para humano',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Controle de Atendimento</h3>
          <p className="text-xs text-muted-foreground">
            Alterne entre IA e atendimento humano
          </p>
        </div>

        <HandoffToggle
          conversationId={conversationId}
          currentHandler={currentHandler}
          aiEnabled={aiEnabled}
          onToggle={handleToggle}
          disabled={isLoading}
          showLabel={false}
        />
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-between">
        <AIStatusIndicator
          status={aiStatus}
          needsAttention={needsAttention}
          showAnimation={true}
        />

        {needsAttention && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowTransferDialog(true)}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Assumir Conversa
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowHistory(true)}
          className="flex-1"
        >
          <History className="h-3 w-3 mr-1" />
          Histórico
        </Button>

        {currentHandler === 'ai' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTransferDialog(true)}
            className="flex-1"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Transferir
          </Button>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para Atendimento Humano</DialogTitle>
            <DialogDescription>
              Informe o motivo da transferência. O cliente será notificado que um atendente irá responder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Ex: Cliente solicitou falar com atendente, dúvida complexa, situação urgente..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransferDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransferToHuman}
              disabled={isLoading || !transferReason.trim()}
            >
              {isLoading ? 'Transferindo...' : 'Transferir Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Handoff</DialogTitle>
            <DialogDescription>
              Todas as transferências entre IA e atendimento humano desta conversa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {handoffHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma transferência registrada ainda
              </p>
            ) : (
              handoffHistory.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item.from_handler === 'ai' ? '🤖 IA' : '👤 Humano'}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm font-medium">
                          {item.to_handler === 'ai' ? '🤖 IA' : '👤 Humano'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {item.triggered_by === 'manual' ? '👤 Manual' : '🤖 Automático'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
