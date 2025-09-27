import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Zap,
} from "lucide-react";

interface NavbarProps {
  userName?: string;
  userEmail?: string;
  unreadNotifications?: number;
  organizationName?: string;
}

export function Navbar({
  userName = "Dr. Ana Silva",
  userEmail = "ana@petcare.com",
  unreadNotifications = 3,
  organizationName = "Pet Care Center",
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo e Nome da Organização */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
              Auzap
            </span>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {organizationName}
          </div>
        </div>

        {/* Centro - Status de Conexão */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs font-medium text-success">WhatsApp Conectado</span>
          </div>
        </div>

        {/* Direita - Ações do Usuário */}
        <div className="flex items-center gap-4">
          {/* Notificações */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* Mensagens Ativas */}
          <Button variant="ghost" size="sm" className="relative">
            <MessageSquare className="h-4 w-4" />
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
            >
              5
            </Badge>
          </Button>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/user.jpg" alt={userName} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}