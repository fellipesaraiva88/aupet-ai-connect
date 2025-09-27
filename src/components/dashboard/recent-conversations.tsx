import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppMessage } from "@/components/ui/whatsapp-message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bot } from "lucide-react";

const recentConversations = [
  {
    id: 1,
    customerName: "Maria Silva",
    customerAvatar: "",
    lastMessage: "Gostaria de agendar um banho para minha Golden Retriever",
    timestamp: "2 min",
    isUnread: true,
    isAIHandled: false,
    petName: "Luna",
  },
  {
    id: 2,
    customerName: "João Santos",
    customerAvatar: "",
    lastMessage: "Obrigado pelo atendimento! O Buddy adorou o banho.",
    timestamp: "15 min",
    isUnread: false,
    isAIHandled: true,
    petName: "Buddy",
  },
  {
    id: 3,
    customerName: "Ana Costa",
    customerAvatar: "",
    lastMessage: "Qual o horário de funcionamento aos sábados?",
    timestamp: "1h",
    isUnread: true,
    isAIHandled: true,
    petName: "Mimi",
  },
  {
    id: 4,
    customerName: "Carlos Lima",
    customerAvatar: "",
    lastMessage: "Preciso remarcar a consulta do Rex para segunda",
    timestamp: "2h",
    isUnread: false,
    isAIHandled: false,
    petName: "Rex",
  },
];

export function RecentConversations() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversas Recentes
            </CardTitle>
            <CardDescription>
              Últimas interações com seus clientes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.customerAvatar} />
              <AvatarFallback className="bg-gradient-primary text-white">
                {conversation.customerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">
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
              <p className="text-sm text-muted-foreground line-clamp-1">
                {conversation.lastMessage}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {conversation.timestamp}
              </span>
              {conversation.isUnread && (
                <div className="h-2 w-2 rounded-full bg-accent" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}