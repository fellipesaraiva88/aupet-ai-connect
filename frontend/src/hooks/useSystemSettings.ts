import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from './use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.get(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.put(`${API_URL}/api/admin/settings`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.error || 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  const testEmail = useMutation({
    mutationFn: async (emailConfig: any) => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.post(`${API_URL}/api/admin/settings/test-email`, emailConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Teste bem-sucedido',
        description: 'A configuração de email está funcionando corretamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no teste',
        description: error.response?.data?.error || 'Falha ao testar a configuração de email.',
        variant: 'destructive',
      });
    },
  });

  const testWhatsApp = useMutation({
    mutationFn: async (whatsappConfig: any) => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.post(`${API_URL}/api/admin/settings/test-whatsapp`, whatsappConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Teste bem-sucedido',
        description: 'A Evolution API está funcionando corretamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no teste',
        description: error.response?.data?.error || 'Falha ao testar a Evolution API.',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutateAsync,
    testEmail: testEmail.mutateAsync,
    testWhatsApp: testWhatsApp.mutateAsync,
    isUpdating: updateSettings.isPending,
    isTesting: testEmail.isPending || testWhatsApp.isPending,
  };
}
