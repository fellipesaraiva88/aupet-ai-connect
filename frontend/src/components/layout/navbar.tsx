import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationSystem } from "@/components/ui/notification-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Sparkles,
  Search,
} from "lucide-react";

interface NavbarProps {
  unreadNotifications?: number;
  organizationName?: string;
}

export function Navbar({
  unreadNotifications = 3,
  organizationName,
}: NavbarProps) {
  const { user, userProfile, signOut } = useAuthContext();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotifications();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Até logo! 👋",
        description: "Obrigado por cuidar de tantas famílias hoje. Estamos aqui quando precisar!",
      });
    }
  };

  const userName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = userProfile?.email || user?.email || 'usuario@exemplo.com';
  const currentOrganizationName = organizationName || userProfile?.organization?.name || "Meu Pet VIP";
  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-white/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Área de Busca Apple-style */}
        <div className="flex items-center gap-4 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-9 pl-10 pr-4 rounded-[10px] border border-border/30 bg-white/60 focus:bg-white focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-200 text-[13px] placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Centro - Status Apple-style */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-[12px] bg-primary/6 px-3 py-1.5 border border-primary/10">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-apple-pulse" />
            <span className="text-[12px] font-medium text-primary tracking-[-0.01em]">Sistema Ativo</span>
          </div>
        </div>

        {/* Direita - Ações Apple-style */}
        <div className="flex items-center gap-2">
          {/* Notificações */}
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRemove={removeNotification}
            onAction={(notification) => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }}
          />

          {/* Mensagens Ativas */}
          <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-[10px] hover:bg-secondary/50 transition-all duration-200">
            <MessageSquare className="h-4 w-4" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 text-[9px] bg-primary text-white font-medium animate-apple-pulse">
              5
            </Badge>
          </Button>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-[10px] hover:scale-105 transition-all duration-200">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={userProfile?.avatar_url || "/avatars/user.jpg"} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[12px]">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 rounded-[16px] border-border/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-apple-scale-in" align="end">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.avatar_url || "/avatars/user.jpg"} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[12px]">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-[13px] font-semibold leading-none tracking-[-0.01em]">{userName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground mt-1 tracking-[-0.005em]">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-3 bg-border/30" />
              <DropdownMenuItem className="mx-3 rounded-[8px] text-[13px] tracking-[-0.01em]">
                <User className="mr-3 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="mx-3 rounded-[8px] text-[13px] tracking-[-0.01em]">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-3 bg-border/30" />
              <DropdownMenuItem className="mx-3 rounded-[8px] text-destructive focus:text-destructive text-[13px] tracking-[-0.01em]" onClick={handleSignOut}>
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}