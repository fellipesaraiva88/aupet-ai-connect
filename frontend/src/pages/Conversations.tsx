import React, { useState, useEffect } from "react";
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
import { useConversations, useOrganizationId } from "@/hooks/useSupabaseData";
import { useRealTimeSubscriptions, useMessageRealTime } from "@/hooks/useRealTime";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const Conversations = () => {
  const activeMenuItem = useActiveNavigation();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<MessageWithDetails[]>([]);
  const navigate = useNavigate();

  // Get organization ID and real conversation data
  const organizationId = useOrganizationId();
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useConversations(organizationId);

  // Set up real-time subscriptions
  useRealTimeSubscriptions(organizationId);

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

  // Transform Supabase data to component interface
  const transformedConversations: ConversationWithDetails[] = conversations.map(conv => ({
    id: conv.id,
    customerName: conv.whatsapp_contacts?.name || 'Cliente',
    customerPhone: conv.whatsapp_contacts?.phone || '',
    petName: conv.whatsapp_contacts?.pets?.[0]?.name || undefined,
    lastMessage: conv.whatsapp_messages?.[0]?.content || '',
    timestamp: new Date(conv.updated_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    unread: 0, // TODO: Calculate unread messages
    isAIHandled: conv.status === 'ai_handled',
    status: conv.status,
    contact_id: conv.contact_id,
    updated_at: conv.updated_at,
  }));

  // Filter conversations based on search query
  const filteredConversations = transformedConversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.petName && conv.petName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          direction: msg.direction,
          message_type: msg.message_type,
        }));

        setConversationMessages(transformedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Erro ao carregar mensagens",
          description: "Não foi possível carregar as mensagens da conversa",
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

  // Handler functions
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: selectedConversation.id,
          instance_id: 'default-instance', // TODO: Get from context
          content: messageText,
          direction: 'outbound',
          message_type: 'text',
          external_id: `out-${Date.now()}`,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${selectedConversation.customerName}`,
      });

      setMessageText("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  const handlePhoneCall = (phone: string) => {
    toast({
      title: "Iniciando chamada",
      description: `Ligando para ${phone}`,
    });
    // TODO: Integrate with phone system
    console.log("Calling:", phone);
  };

  const handleVideoCall = (conversationId: number) => {
    toast({
      title: "Iniciando videochamada",
      description: "Preparando videochamada...",
    });
    // TODO: Integrate with video call system
    console.log("Video calling conversation:", conversationId);
  };

  const handleAssignConversation = (conversationId: number) => {
    toast({
      title: "Conversa atribuída",
      description: "Conversa foi atribuída a um atendente",
    });
    // TODO: Assign conversation to agent
    console.log("Assigning conversation:", conversationId);
  };

  const handleEscalateConversation = (conversationId: number) => {
    toast({
      title: "Conversa escalada",
      description: "Conversa foi escalada para atendimento humano",
    });
    // TODO: Escalate to human agent
    console.log("Escalating conversation:", conversationId);
  };

  const handleArchiveConversation = (conversationId: number) => {
    toast({
      title: "Conversa arquivada",
      description: "Conversa foi arquivada com sucesso",
    });
    // TODO: Archive conversation
    console.log("Archiving conversation:", conversationId);
  };

  const handleFileAttachment = () => {
    toast({
      title: "Anexar arquivo",
      description: "Funcionalidade de anexo será implementada",
    });
    // TODO: Implement file attachment
    console.log("Attaching file");
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
          <div className="w-80 border-r border-border bg-card/50">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold mb-3">Conversas</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {filteredConversations.filter(c => c.unread > 0).length} não lidas
                </Badge>
              </div>
              {showFilters && (
                <div className="mt-3 p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Filtros avançados serão implementados aqui
                  </p>
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
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedConversation && selectedConversation.id === conversation.id ? "bg-accent/50" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {conversation.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {conversation.customerName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          • {conversation.petName}
                        </span>
                        {conversation.isAIHandled && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            IA
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {conversation.timestamp}
                      </span>
                      {conversation.unread > 0 && (
                        <div className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread}
                        </div>
                      )}
                    </div>
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
                <div className="p-4 border-b border-border bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {selectedConversation.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.customerName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.customerPhone}
                          {selectedConversation.petName && ` • Pet: ${selectedConversation.petName}`}
                        </p>
                      </div>
                      {selectedConversation.isAIHandled && (
                        <Badge variant="secondary">
                          <Bot className="h-3 w-3 mr-1" />
                          Atendimento Auzap
                        </Badge>
                      )}
                    </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePhoneCall(selectedConversation.customerPhone)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVideoCall(selectedConversation.id)}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleAssignConversation(selectedConversation.id)}>
                        Atribuir conversa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEscalateConversation(selectedConversation.id)}>
                        Escalar para humano
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveConversation(selectedConversation.id)}>
                        Arquivar
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
            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileAttachment}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Escreva com carinho..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="whatsapp"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {showEmojiPicker && (
                <div className="mt-2 p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Seletor de emojis será implementado aqui
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
            <div className="w-80 border-l border-border bg-card/50 p-4 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Nosso Cliente Especial</h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback className="bg-gradient-primary text-white text-xl">
                        {selectedConversation.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-medium">{selectedConversation.customerName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedConversation.customerPhone}</p>
                  </div>
                </div>
              </div>

              {selectedConversation.petName && (
                <div>
                  <h4 className="font-medium mb-3">Informações do Pet Querido</h4>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">🐕</span>
                        </div>
                        <div>
                          <h5 className="font-medium">{selectedConversation.petName}</h5>
                          <p className="text-sm text-muted-foreground">Pet do cliente</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Momentos Especiais</h4>
                <div className="space-y-2">
                  <div className="text-sm p-2 bg-accent/20 rounded">
                    <span className="font-medium">Conversas anteriores</span>
                    <p className="text-muted-foreground">Disponível no histórico</p>
                  </div>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/conversations/${selectedConversation.id}/history`)}
                >
                  Ver História Completa
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