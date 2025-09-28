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
    <nav className="sticky top-0 z-50 border-b border-border/20 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Área de Busca */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/50 bg-white/50 focus:bg-white focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Centro - Breadcrumb/Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 border border-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm font-medium text-primary">Sistema Ativo</span>
          </div>
        </div>

        {/* Direita - Ações do Usuário */}
        <div className="flex items-center gap-3">
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
          <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-xl hover:bg-secondary/60 transition-all duration-200">
            <MessageSquare className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-accent animate-pulse-soft">
              5
            </Badge>
          </Button>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:scale-105 transition-all duration-200">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url || "/avatars/user.jpg"} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl border-border/50 shadow-lg animate-scale-in" align="end">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile?.avatar_url || "/avatars/user.jpg"} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem className="mx-2 rounded-lg">
                <User className="mr-3 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="mx-2 rounded-lg">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem className="mx-2 rounded-lg text-destructive focus:text-destructive" onClick={handleSignOut}>
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