import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { toast } from "@/hooks/use-toast";
import { useConversations, useOrganizationId } from "@/hooks/useApiData";
import { useRealTimeSubscriptions } from "@/hooks/useRealTime";
import MomentumBoard from "@/components/momentum/MomentumBoard";
import { MomentumData } from "@/components/momentum/MomentumCard";
import { transformToMomentumData } from "@/utils/momentumAnalyzer";
import { supabase } from "@/integrations/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WhatsAppSetup } from "@/components/whatsapp/WhatsAppSetup";
import { TemplateManager } from "@/components/whatsapp/TemplateManager";
import { AutoReplySettings } from "@/components/whatsapp/AutoReplySettings";
import {
  Settings,
  Bot,
  FileText,
  MessageSquare,
  Phone,
  Calendar,
  DollarSign,
  ShoppingCart,
  Heart,
  Star,
  TrendingUp,
} from "lucide-react";

// Conversation data interface for momentum analysis
interface ConversationWithDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  petName?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isAIHandled: boolean;
  status: string;
  contact_id: string;
  updated_at: string;
}

const Conversations = () => {
  const activeMenuItem = useActiveNavigation();
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showAutoReplySettings, setShowAutoReplySettings] = useState(false);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get organization ID and real conversation data
  const organizationId = useOrganizationId();
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useConversations(organizationId);

  // Set up real-time subscriptions
  useRealTimeSubscriptions(organizationId);

  // Load WhatsApp instances
  useEffect(() => {
    if (!organizationId) return;

    const loadWhatsAppInstances = async () => {
      try {
        const { data: instances, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setWhatsappInstances(instances || []);

        // Set default instance if available
        if (instances && instances.length > 0 && !selectedInstance) {
          setSelectedInstance(instances[0].id);
        }
      } catch (error) {
        console.error('Error loading WhatsApp instances:', error);
      }
    };

    loadWhatsAppInstances();
  }, [organizationId, selectedInstance]);

  // Transform Supabase data to momentum data with AI analysis
  const momentumData: MomentumData[] = useMemo(() => {
    const transformedConversations: ConversationWithDetails[] = conversations.map(conv => ({
      id: conv.id,
      customerName: conv.whatsapp_contacts?.name || 'Cliente Especial',
      customerPhone: conv.whatsapp_contacts?.phone || '',
      petName: conv.whatsapp_contacts?.pets?.[0]?.name || undefined,
      lastMessage: conv.whatsapp_messages?.[0]?.content || 'Conversa iniciada 🐾',
      timestamp: new Date(conv.updated_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      unread: Math.floor(Math.random() * 3), // Simulated unread count
      isAIHandled: conv.status === 'ai_handled',
      status: conv.status,
      contact_id: conv.contact_id,
      updated_at: conv.updated_at,
    }));

    return transformToMomentumData(transformedConversations);
  }, [conversations]);

  // Handle momentum card actions
  const handleMomentumAction = useCallback(async (action: string, data: MomentumData) => {
    try {
      switch (action) {
        case 'close_sale':
          toast({
            title: "🎉 Finalizando venda!",
            description: `Preparando proposta final para ${data.customerName}`,
          });
          break;

        case 'send_quote':
          toast({
            title: "💰 Enviando orçamento",
            description: `Orçamento personalizado sendo preparado para ${data.petName || 'o pet'}`,
          });
          break;

        case 'schedule_urgent':
          toast({
            title: "🚨 Agendamento urgente",
            description: "Buscando horário prioritário para emergência",
          });
          navigate('/appointments');
          break;

        case 'nurture':
          toast({
            title: "💝 Nutrindo relacionamento",
            description: "Enviando conteúdo especial sobre cuidados com pets",
          });
          setShowTemplateManager(true);
          break;

        case 'send_content':
          toast({
            title: "📚 Compartilhando conhecimento",
            description: "Enviando dicas valiosas sobre saúde do pet",
          });
          setShowTemplateManager(true);
          break;

        case 'propose_appointment':
          toast({
            title: "📅 Propondo consulta",
            description: "Sugerindo check-up preventivo personalizado",
          });
          break;

        case 'start_conversation':
          toast({
            title: "👋 Iniciando conversa",
            description: "Preparando saudação calorosa e acolhedora",
          });
          setShowTemplateManager(true);
          break;

        case 'send_tip':
          toast({
            title: "💡 Dica do dia",
            description: "Compartilhando dica especial sobre cuidados com pets",
          });
          break;

        case 'loyalty':
          toast({
            title: "⭐ Programa fidelidade",
            description: "Apresentando benefícios exclusivos para clientes especiais",
          });
          break;

        case 'call':
          toast({
            title: "📞 Iniciando ligação",
            description: `Conectando com ${data.customerName}...`,
          });
          break;

        case 'message':
          toast({
            title: "💬 Abrindo conversa",
            description: "Redirecionando para chat personalizado",
          });
          break;

        default:
          console.log('Unhandled action:', action, data);
      }
    } catch (error) {
      console.error('Error handling momentum action:', error);
      toast({
        title: "Ops! 🐾",
        description: "Algo deu errado, mas vamos resolver juntos!",
        variant: "destructive",
      });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {/* Main Momentum Board */}
            <MomentumBoard
              data={momentumData}
              onAction={handleMomentumAction}
              loading={conversationsLoading}
            />

            {/* Setup Dialogs */}
            <Dialog open={showWhatsAppSetup} onOpenChange={setShowWhatsAppSetup}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar WhatsApp</DialogTitle>
                  <DialogDescription>Configure sua instância do WhatsApp</DialogDescription>
                </DialogHeader>
                <WhatsAppSetup organizationId={organizationId} />
              </DialogContent>
            </Dialog>

            <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Gerenciar Templates</DialogTitle>
                  <DialogDescription>Configure templates de mensagem</DialogDescription>
                </DialogHeader>
                <TemplateManager 
                  organizationId={organizationId} 
                  onUseTemplate={() => {}} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showAutoReplySettings} onOpenChange={setShowAutoReplySettings}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar Auto Resposta</DialogTitle>
                  <DialogDescription>Configure respostas automáticas da IA</DialogDescription>
                </DialogHeader>
                <AutoReplySettings 
                  organizationId={organizationId}
                  instanceId={selectedInstance || ''}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;