import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations, useOrganizationId } from "@/hooks/useSupabaseData";
import { MessageSquare, Bot, Clock } from "lucide-react";

// Utility function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

export function RecentConversations() {
  const navigate = useNavigate();
  const organizationId = useOrganizationId();
  const { data: conversations = [], isLoading, error } = useConversations(organizationId);

  // Transform conversations for display (limit to 5 most recent)
  const displayConversations = conversations.slice(0, 5).map(conv => ({
    id: conv.id,
    customerName: conv.whatsapp_contacts?.name || 'Cliente',
    customerAvatar: "",
    lastMessage: conv.whatsapp_messages?.[0]?.content || 'Sem mensagens',
    timestamp: formatRelativeTime(conv.updated_at),
    isUnread: false, // TODO: Calculate based on read status
    isAIHandled: conv.status === 'ai_handled',
    petName: conv.whatsapp_contacts?.pets?.[0]?.name || undefined,
  }));

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/conversations')}
          >
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Erro ao carregar conversas</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : displayConversations.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma conversa ainda</p>
            <p className="text-xs">As conversas aparecerão aqui quando chegarem</p>
          </div>
        ) : (
          // Actual conversations
          displayConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate('/conversations')}
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
                  {conversation.petName && (
                    <span className="text-xs text-muted-foreground">
                      • {conversation.petName}
                    </span>
                  )}
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
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {conversation.timestamp}
                </span>
                {conversation.isUnread && (
                  <div className="h-2 w-2 rounded-full bg-accent" />
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}