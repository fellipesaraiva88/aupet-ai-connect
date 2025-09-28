import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { WhatsAppMessage } from "@/components/ui/whatsapp-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useConversations, useOrganizationId } from "@/hooks/useApiData";
import { useRealTimeSubscriptions, useMessageRealTime } from "@/hooks/useRealTime";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppSetup } from "@/components/whatsapp/WhatsAppSetup";
import { TemplateManager } from "@/components/whatsapp/TemplateManager";
import { AutoReplySettings } from "@/components/whatsapp/AutoReplySettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Search,
  Filter,
  Bot,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreHorizontal,
  Loader2,
  Heart,
  Star,
  Archive,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Settings,
  FileText,
  Smartphone,
} from "lucide-react";

// Real-time conversation data interface
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

interface MessageWithDetails {
  id: string;
  message: string;
  timestamp: string;
  isFromMe: boolean;
  senderName?: string;
  isRead?: boolean;
  direction: 'inbound' | 'outbound';
  message_type: string;
}

// Filter options for conversations
type FilterStatus = 'all' | 'ai_handled' | 'human_needed' | 'resolved' | 'waiting';
type SortOption = 'recent' | 'unread' | 'name' | 'priority';

interface ConversationFilters {
  status: FilterStatus;
  sort: SortOption;
  showFavorites: boolean;
}

const Conversations = () => {
  const activeMenuItem = useActiveNavigation();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<MessageWithDetails[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({
    status: 'all',
    sort: 'recent',
    showFavorites: false,
  });
  const [favoriteConversations, setFavoriteConversations] = useState<Set<string>>(new Set());
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

  // Set up message-specific real-time updates
  useMessageRealTime(selectedConversation?.id || null, (newMessage) => {
    const transformedMessage: MessageWithDetails = {
      id: newMessage.id,
      message: newMessage.content,
      timestamp: new Date(newMessage.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isFromMe: newMessage.direction === 'outbound',
      senderName: newMessage.direction === 'inbound' ? selectedConversation?.customerName : undefined,
      isRead: true,
      direction: newMessage.direction,
      message_type: newMessage.message_type,
    };
    setConversationMessages(prev => [...prev, transformedMessage]);
  });

  // Transform Supabase data to component interface with memoization
  const transformedConversations: ConversationWithDetails[] = useMemo(() =>
    conversations.map(conv => ({
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
    })), [conversations]);

  // Advanced filter and sort conversations with memoization
  const filteredConversations = useMemo(() => {
    let filtered = transformedConversations;

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.petName && conv.petName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.customerPhone.includes(searchQuery)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(conv => {
        switch (filters.status) {
          case 'ai_handled':
            return conv.isAIHandled;
          case 'human_needed':
            return conv.status === 'human_needed' || conv.unread > 2;
          case 'resolved':
            return conv.status === 'resolved';
          case 'waiting':
            return conv.status === 'waiting';
          default:
            return true;
        }
      });
    }

    // Apply favorites filter
    if (filters.showFavorites) {
      filtered = filtered.filter(conv => favoriteConversations.has(conv.id));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'unread':
          return b.unread - a.unread;
        case 'name':
          return a.customerName.localeCompare(b.customerName);
        case 'priority':
          return (b.unread > 2 ? 1 : 0) - (a.unread > 2 ? 1 : 0);
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [transformedConversations, searchQuery, filters, favoriteConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const transformedMessages: MessageWithDetails[] = messages.map(msg => ({
          id: msg.id,
          message: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isFromMe: msg.direction === 'outbound',
          senderName: msg.direction === 'inbound' ? selectedConversation.customerName : undefined,
          isRead: true,
          direction: msg.direction as 'inbound' | 'outbound',
          message_type: msg.message_type,
        }));

        setConversationMessages(transformedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Ops, algo deu errado",
          description: "Não conseguimos carregar o papo com essa família",
          variant: "destructive",
        });
      }
    };

    loadMessages();
  }, [selectedConversation]);


  // Set default selected conversation
  useEffect(() => {
    if (!selectedConversation && transformedConversations.length > 0) {
      setSelectedConversation(transformedConversations[0]);
    }
  }, [transformedConversations, selectedConversation]);

  // Handler functions with useCallback for performance
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedConversation || !selectedInstance) return;

    setIsTyping(true);
    try {
      // Send via API to handle WhatsApp delivery
      const response = await fetch(`/api/whatsapp/${selectedInstance}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedConversation.customerPhone,
          message: messageText,
          type: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      toast({
        title: "Mensagem enviada com carinho 💝",
        description: `Sua mensagem chegou até ${selectedConversation.customerName} e seu pet!`,
      });

      setMessageText("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ops, algo deu errado 🐾",
        description: "Não conseguimos enviar a mensagem. Vamos tentar novamente?",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  }, [messageText, selectedConversation, selectedInstance]);

  const toggleFavorite = useCallback((conversationId: string) => {
    setFavoriteConversations(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(conversationId)) {
        newFavorites.delete(conversationId);
        toast({
          title: "Removido dos favoritos 💙",
          description: "Conversa removida dos seus favoritos",
        });
      } else {
        newFavorites.add(conversationId);
        toast({
          title: "Adicionado aos favoritos ⭐",
          description: "Conversa marcada como favorita!",
        });
      }
      return newFavorites;
    });
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handlePhoneCall = useCallback((phone: string) => {
    toast({
      title: "Conectando com carinho 📞",
      description: `Ligando para ${phone} - O cliente ficará muito feliz!`,
    });
    // TODO: Integrate with phone system
    console.log("Calling:", phone);
  }, []);

  const handleVideoCall = useCallback((conversationId: string) => {
    toast({
      title: "Vamos nos ver! 📹",
      description: "Preparando videochamada para você e o pet se conhecerem melhor...",
    });
    // TODO: Integrate with video call system
    console.log("Video calling conversation:", conversationId);
  }, []);

  const handleAssignConversation = useCallback((conversationId: string) => {
    toast({
      title: "Especialista a caminho! 👨‍⚕️",
      description: "Conversa foi atribuída ao melhor especialista em pets",
    });
    // TODO: Assign conversation to agent
    console.log("Assigning conversation:", conversationId);
  }, []);

  const handleEscalateConversation = useCallback((conversationId: string) => {
    toast({
      title: "Atendimento humano ativado! 🤝",
      description: "Conversa escalada para nossos especialistas cuidarem pessoalmente",
    });
    // TODO: Escalate to human agent
    console.log("Escalating conversation:", conversationId);
  }, []);

  const handleArchiveConversation = useCallback((conversationId: string) => {
    toast({
      title: "Conversa arquivada com carinho 📁",
      description: "Conversa foi arquivada - Sempre aqui quando precisar!",
    });
    // TODO: Archive conversation
    console.log("Archiving conversation:", conversationId);
  }, []);

  const handleFileAttachment = useCallback(() => {
    toast({
      title: "Anexar arquivo 📎",
      description: "Em breve você poderá enviar fotos do seu pet e documentos!",
    });
    // TODO: Implement file attachment
    console.log("Attaching file");
  }, []);

  const handleUseTemplate = useCallback(async (template: any) => {
    if (!selectedConversation || !selectedInstance) return;

    let content = template.content;

    // Replace variables if any
    content = content.replace(/\{\{customerName\}\}/g, selectedConversation.customerName);
    content = content.replace(/\{\{petName\}\}/g, selectedConversation.petName || 'seu pet');

    setMessageText(content);
    setShowTemplateManager(false);

    toast({
      title: "Template aplicado! ✨",
      description: "Mensagem preparada com carinho para seu cliente",
    });
  }, [selectedConversation, selectedInstance]);

  // Status badge component
  const getStatusBadge = (conversation: ConversationWithDetails) => {
    if (conversation.isAIHandled) {
      return (
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
          <Bot className="h-3 w-3 mr-1" />
          Auzap IA
        </Badge>
      );
    }

    if (conversation.unread > 2) {
      return (
        <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      );
    }

    if (conversation.status === 'resolved') {
      return (
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Resolvido
        </Badge>
      );
    }

    if (conversation.status === 'waiting') {
      return (
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Aguardando
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
        />
        
        <div className="flex-1 flex">
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card/50 glass-morphism">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Conversas Especiais
                  </h2>
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <div className="flex gap-1">
                  <Dialog open={showWhatsAppSetup} onOpenChange={setShowWhatsAppSetup}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Configurar WhatsApp">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Configuração WhatsApp</DialogTitle>
                        <DialogDescription>
                          Configure suas instâncias do WhatsApp Business
                        </DialogDescription>
                      </DialogHeader>
                      <WhatsAppSetup organizationId={organizationId} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Templates de Mensagem">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Templates de Mensagem</DialogTitle>
                        <DialogDescription>
                          Gerencie seus templates de mensagens personalizados
                        </DialogDescription>
                      </DialogHeader>
                      <TemplateManager organizationId={organizationId} onUseTemplate={handleUseTemplate} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showAutoReplySettings} onOpenChange={setShowAutoReplySettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Auto-respostas">
                        <Bot className="h-4 w-4 text-green-600" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Auto-respostas Inteligentes</DialogTitle>
                        <DialogDescription>
                          Configure respostas automáticas para melhorar o atendimento
                        </DialogDescription>
                      </DialogHeader>
                      {selectedInstance && (
                        <AutoReplySettings
                          organizationId={organizationId}
                          instanceId={selectedInstance}
                        />
                      )}
                      {!selectedInstance && (
                        <div className="text-center p-8 text-muted-foreground">
                          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Selecione uma instância WhatsApp para configurar auto-respostas</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, pet ou telefone..."
                  className="pl-10 glass-morphism border-blue-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="glass-morphism"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                </Button>
                <Button
                  variant={filters.showFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ showFavorites: !filters.showFavorites })}
                  className="glass-morphism"
                >
                  <Star className={`h-4 w-4 mr-1 ${filters.showFavorites ? 'fill-current' : ''}`} />
                  Favoritos
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {filteredConversations.filter(c => c.unread > 0).length} não lidas
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {filteredConversations.length} total
                </Badge>
              </div>

              {/* WhatsApp Instance Selector */}
              {whatsappInstances.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Instância WhatsApp:
                  </label>
                  <select
                    value={selectedInstance || ''}
                    onChange={(e) => setSelectedInstance(e.target.value)}
                    className="w-full text-sm border border-blue-200 rounded-md px-2 py-1 bg-white/50"
                  >
                    {whatsappInstances.map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.instance_name} {instance.is_connected ? '🟢' : '🔴'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {whatsappInstances.length === 0 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700 text-center">
                    <Smartphone className="h-3 w-3 inline mr-1" />
                    Configure seu WhatsApp para começar!
                  </p>
                </div>
              )}
              {showFilters && (
                <div className="mt-3 p-3 glass-morphism rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Status:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'Todas', icon: MessageSquare },
                        { value: 'ai_handled', label: 'IA', icon: Bot },
                        { value: 'human_needed', label: 'Urgente', icon: AlertCircle },
                        { value: 'resolved', label: 'Resolvidas', icon: CheckCircle2 },
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={filters.status === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange({ status: value as FilterStatus })}
                          className="justify-start text-xs"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Ordenar por:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'recent', label: 'Recentes', icon: Clock },
                        { value: 'unread', label: 'Não lidas', icon: AlertCircle },
                        { value: 'name', label: 'Nome', icon: UserPlus },
                        { value: 'priority', label: 'Prioridade', icon: Zap },
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={filters.sort === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange({ sort: value as SortOption })}
                          className="justify-start text-xs"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-auto">
              {conversationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando conversas...</span>
                </div>
              ) : conversationsError ? (
                <div className="p-4 text-center text-red-500">
                  <p>Erro ao carregar conversas</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`relative p-4 border-b border-border cursor-pointer hover:bg-blue-50/50 transition-all duration-300 group ${
                    selectedConversation && selectedConversation.id === conversation.id
                      ? "bg-blue-50/80 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-blue-200">
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                          {conversation.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {conversation.unread}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold truncate text-foreground">
                          {conversation.customerName}
                        </h4>
                        {conversation.petName && (
                          <div className="flex items-center text-xs text-muted-foreground bg-pink-50 px-2 py-1 rounded-full">
                            🐾 {conversation.petName}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(conversation)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(conversation.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        >
                          <Star
                            className={`h-3 w-3 ${
                              favoriteConversations.has(conversation.id)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {conversation.timestamp}
                        </span>
                      </div>
                      {conversation.unread > 2 && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          Urgente!
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(conversation.id);
                        }}>
                          <Star className="h-4 w-4 mr-2" />
                          {favoriteConversations.has(conversation.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleAssignConversation(conversation.id);
                        }}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Atribuir especialista
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id);
                        }}>
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-purple-50/50 glass-morphism">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-blue-200">
                          <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">
                            {selectedConversation.customerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {favoriteConversations.has(selectedConversation.id) && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                            <Star className="h-3 w-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                            {selectedConversation.customerName}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(selectedConversation.id)}
                            className="p-1 h-6 w-6"
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                favoriteConversations.has(selectedConversation.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-400'
                              }`}
                            />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            📞 {selectedConversation.customerPhone}
                          </p>
                          {selectedConversation.petName && (
                            <div className="flex items-center text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                              🐾 {selectedConversation.petName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(selectedConversation)}
                        {selectedConversation.isAIHandled && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <Bot className="h-3 w-3 mr-1" />
                            Auzap IA Ativo
                          </Badge>
                        )}
                      </div>
                    </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePhoneCall(selectedConversation.customerPhone)}
                    className="glass-morphism hover:bg-green-50"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Ligar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVideoCall(selectedConversation.id)}
                    className="glass-morphism hover:bg-blue-50"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Vídeo
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="glass-morphism">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleAssignConversation(selectedConversation.id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Atribuir especialista
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEscalateConversation(selectedConversation.id)}>
                        <Zap className="h-4 w-4 mr-2" />
                        Escalar para humano
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleArchiveConversation(selectedConversation.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-whatsapp-light/20 to-background">
                  {conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Envie uma mensagem para começar a conversar</p>
                      </div>
                    </div>
                  ) : (
                    conversationMessages.map((message) => (
                      <WhatsAppMessage
                        key={message.id}
                        message={message.message}
                        timestamp={message.timestamp}
                        isFromMe={message.isFromMe}
                        isRead={message.isRead}
                        senderName={message.senderName}
                      />
                    ))
                  )}
                </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-gradient-to-r from-whatsapp-light/10 to-blue-50/30 glass-morphism">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileAttachment}
                  className="glass-morphism hover:bg-blue-50 p-2"
                  title="Anexar arquivo"
                >
                  <Paperclip className="h-5 w-5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateManager(true)}
                  className="glass-morphism hover:bg-purple-50 p-2"
                  title="Usar template"
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Escreva com carinho para o cliente e seu pet... 🐾💝"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="pr-12 glass-morphism border-blue-200 focus:border-blue-400 focus:ring-blue-400 min-h-[44px]"
                    disabled={isTyping}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-blue-50"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Adicionar emoji"
                  >
                    <Smile className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isTyping}
                  className="bg-gradient-primary hover:bg-gradient-primary/90 px-4 py-2 min-h-[44px]"
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-1" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>

              {isTyping && (
                <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando mensagem com carinho...
                </div>
              )}

              {showEmojiPicker && (
                <div className="mt-3 p-4 glass-morphism rounded-lg">
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {['🐕', '🐈', '❤️', '😊', '👍', '🎉', '🐾', '💝', '🌟', '✨', '🎊', '🤗', '😍', '🥰', '💙', '🎈'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => setMessageText(prev => prev + emoji)}
                        className="text-lg hover:bg-blue-50"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Emojis especiais para pets e clientes especiais! 🐾💝
                  </p>
                </div>
              )}
            </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info Panel */}
          {selectedConversation && (
            <div className="w-80 border-l border-border bg-gradient-to-b from-blue-50/30 to-purple-50/20 glass-morphism p-4 space-y-6">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Nosso Cliente Especial 💝
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-blue-200">
                      <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
                        {selectedConversation.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {favoriteConversations.has(selectedConversation.id) && (
                      <div className="absolute top-0 right-1/2 transform translate-x-8 bg-yellow-400 rounded-full p-2">
                        <Star className="h-4 w-4 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{selectedConversation.customerName}</h4>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      📞 {selectedConversation.customerPhone}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePhoneCall(selectedConversation.customerPhone)}
                      className="glass-morphism"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Ligar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFavorite(selectedConversation.id)}
                      className="glass-morphism"
                    >
                      <Heart className={`h-4 w-4 mr-1 ${favoriteConversations.has(selectedConversation.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      {favoriteConversations.has(selectedConversation.id) ? 'Favorito' : 'Favoritar'}
                    </Button>
                  </div>
                </div>
              </div>

              {selectedConversation.petName && (
                <div>
                  <h4 className="font-bold mb-3 text-center bg-gradient-primary bg-clip-text text-transparent">
                    🐾 Informações do Pet Querido
                  </h4>
                  <Card className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="text-center space-y-3">
                        <div className="h-16 w-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl">🐕</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-lg">{selectedConversation.petName}</h5>
                          <p className="text-sm text-muted-foreground">Pet especial da família</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-blue-50 p-2 rounded">
                            <span className="font-medium">Tipo</span>
                            <p className="text-muted-foreground">Cachorro 🐕</p>
                          </div>
                          <div className="bg-pink-50 p-2 rounded">
                            <span className="font-medium">Status</span>
                            <p className="text-green-600">Ativo 💚</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <h4 className="font-bold mb-3 text-center bg-gradient-primary bg-clip-text text-transparent">
                  ✨ Momentos Especiais
                </h4>
                <div className="space-y-3">
                  <Card className="glass-morphism">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">Conversas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversationMessages.length} mensagens trocadas
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-morphism">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">Última atividade</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.timestamp}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="default"
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  onClick={() => navigate(`/conversations/${selectedConversation.id}/history`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver História Completa
                </Button>
                <Button
                  variant="outline"
                  className="w-full glass-morphism"
                  onClick={() => handleEscalateConversation(selectedConversation.id)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Escalar para Humano
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversations;