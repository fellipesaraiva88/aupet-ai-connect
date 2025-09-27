import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Real-time hook for live data updates
export function useRealTimeSubscriptions(organizationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organizationId) return;

    // Create a channel for all real-time updates
    const channel = supabase
      .channel(`realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Conversation change:', payload);
          // Invalidate conversations to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['conversations', organizationId] });

          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nova conversa",
              description: "Uma nova conversa foi iniciada",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          console.log('Message change:', payload);
          // Invalidate conversations to update last message
          queryClient.invalidateQueries({ queryKey: ['conversations', organizationId] });

          if (payload.eventType === 'INSERT' && payload.new?.direction === 'inbound') {
            toast({
              title: "Nova mensagem",
              description: "Você recebeu uma nova mensagem",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_contacts',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Contact change:', payload);
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations', organizationId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Appointment change:', payload);
          // Invalidate appointments and dashboard stats
          queryClient.invalidateQueries({ queryKey: ['appointments', organizationId] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', organizationId] });

          if (payload.eventType === 'INSERT') {
            toast({
              title: "Novo agendamento",
              description: "Um novo agendamento foi criado",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Pet change:', payload);
          // Invalidate pets and related queries
          queryClient.invalidateQueries({ queryKey: ['pets', organizationId] });
          queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscriptions active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          toast({
            title: "Erro de conexão em tempo real",
            description: "Algumas atualizações podem não aparecer automaticamente",
            variant: "destructive",
          });
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [organizationId, queryClient]);
}

// Hook for message-specific real-time updates
export function useMessageRealTime(conversationId: string | null, onNewMessage?: (message: any) => void) {
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message in conversation:', payload);
          if (onNewMessage) {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage]);
}