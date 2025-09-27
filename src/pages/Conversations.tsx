import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { WhatsAppMessage } from "@/components/ui/whatsapp-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";

const conversations = [
  {
    id: 1,
    customerName: "Maria Silva",
    customerPhone: "+55 11 99999-1234",
    petName: "Luna",
    lastMessage: "Gostaria de agendar um banho para minha Golden",
    timestamp: "14:32",
    unread: 2,
    isAIHandled: false,
    status: "active",
  },
  {
    id: 2,
    customerName: "João Santos",
    customerPhone: "+55 11 99999-5678",
    petName: "Buddy",
    lastMessage: "Obrigado pelo atendimento!",
    timestamp: "13:45",
    unread: 0,
    isAIHandled: true,
    status: "resolved",
  },
  {
    id: 3,
    customerName: "Ana Costa",
    customerPhone: "+55 11 99999-9012",
    petName: "Mimi",
    lastMessage: "Qual o horário de funcionamento?",
    timestamp: "12:15",
    unread: 1,
    isAIHandled: true,
    status: "active",
  },
];

const messages = [
  {
    id: 1,
    message: "Olá! Gostaria de agendar um banho para minha Golden Retriever Luna",
    timestamp: "14:30",
    isFromMe: false,
    senderName: "Maria Silva",
  },
  {
    id: 2,
    message: "Olá Maria! Claro, posso ajudar com o agendamento da Luna. Que dia seria melhor para você?",
    timestamp: "14:31",
    isFromMe: true,
    isRead: true,
  },
  {
    id: 3,
    message: "Seria possível amanhã pela manhã?",
    timestamp: "14:32",
    isFromMe: false,
    senderName: "Maria Silva",
  },
];

const Conversations = () => {
  const [activeMenuItem] = useState("conversations");
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={() => {}}
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
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {conversations.filter(c => c.unread > 0).length} não lidas
                </Badge>
              </div>
            </div>

            <div className="overflow-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedConversation.id === conversation.id ? "bg-accent/50" : ""
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
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
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
                      {selectedConversation.customerPhone} • Pet: {selectedConversation.petName}
                    </p>
                  </div>
                  {selectedConversation.isAIHandled && (
                    <Badge variant="secondary">
                      <Bot className="h-3 w-3 mr-1" />
                      Atendimento Automático
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-whatsapp-light/20 to-background">
              {messages.map((message) => (
                <WhatsAppMessage
                  key={message.id}
                  message={message.message}
                  timestamp={message.timestamp}
                  isFromMe={message.isFromMe}
                  isRead={message.isRead}
                  senderName={message.senderName}
                />
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="pr-10"
                  />
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="whatsapp" size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Info Panel */}
          <div className="w-80 border-l border-border bg-card/50 p-4 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Informações do Cliente</h3>
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

            <div>
              <h4 className="font-medium mb-3">Pet Information</h4>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">🐕</span>
                    </div>
                    <div>
                      <h5 className="font-medium">{selectedConversation.petName}</h5>
                      <p className="text-sm text-muted-foreground">Golden Retriever</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Idade:</span>
                      <span>3 anos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso:</span>
                      <span>28kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último banho:</span>
                      <span>15 dias atrás</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-medium mb-3">Histórico de Serviços</h4>
              <div className="space-y-2">
                <div className="text-sm p-2 bg-accent/20 rounded">
                  <span className="font-medium">Banho e Tosa</span>
                  <p className="text-muted-foreground">15 dias atrás</p>
                </div>
                <div className="text-sm p-2 bg-accent/20 rounded">
                  <span className="font-medium">Consulta Veterinária</span>
                  <p className="text-muted-foreground">2 meses atrás</p>
                </div>
              </div>
            </div>

            <div>
              <Button variant="outline" className="w-full">
                Ver Perfil Completo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;