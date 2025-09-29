import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  Package,
  Settings,
  BarChart3,
  Bot,
  Heart,
  Sparkles,
  Activity,
  Zap,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Central do Amor",
    description: "Visão geral",
    icon: LayoutDashboard,
    href: "/",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "conversations",
    label: "Conversas Especiais",
    description: "Chat com clientes",
    icon: MessageSquare,
    href: "/conversations",
    badge: 5,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "clients-pets",
    label: "Famílias & Pets",
    description: "Gestão completa",
    icon: Users,
    href: "/clients-pets",
    badge: "Nova",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "appointments",
    label: "Encontros de Cuidado",
    description: "Agendamentos",
    icon: Calendar,
    href: "/appointments",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "catalog",
    label: "Lojinha do Amor",
    description: "Produtos & serviços",
    icon: Package,
    href: "/catalog",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "ai-config",
    label: "Configuração IA",
    description: "Assistente virtual",
    icon: Bot,
    href: "/ai-config",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "analytics",
    label: "Insights do Coração",
    description: "Relatórios & métricas",
    icon: BarChart3,
    href: "/analytics",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "settings",
    label: "Preferências",
    description: "Configurações",
    icon: Settings,
    href: "/settings",
    color: "from-slate-500 to-gray-500",
  },
];

export function Sidebar({
  className,
  activeItem = "dashboard",
  onItemClick,
}: SidebarProps) {
  const navigate = useNavigate();

  const handleItemClick = (item: typeof menuItems[0]) => {
    onItemClick?.(item.id);
    if (item.href) {
      navigate(item.href);
    }
  };
  return (
    <div
      className={cn(
        "flex h-full w-80 flex-col bg-gradient-to-b from-background via-background/95 to-secondary/20 backdrop-blur-xl border-r border-border/50 shadow-2xl",
        className
      )}
    >
      {/* Modern Header with Gradient */}
      <div className="relative px-6 py-6 border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 shadow-lg animate-pulse">
            <Heart className="h-6 w-6 text-white drop-shadow-sm" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground tracking-tight">
              Auzap 💝
            </span>
            <span className="text-sm text-muted-foreground font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Cuidado com Amor & IA
            </span>
          </div>
        </div>
      </div>

      {/* Modern Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <div
              key={item.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-4 h-14 px-4 rounded-2xl font-medium transition-all duration-300 group-hover:scale-[1.02]",
                  "relative overflow-hidden border border-transparent",
                  isActive ? [
                    "bg-gradient-to-r text-white shadow-xl border-white/20",
                    `bg-gradient-to-r ${item.color}`,
                    "hover:shadow-2xl"
                  ] : [
                    "hover:bg-secondary/50 hover:border-border/30 hover:shadow-lg",
                    "text-muted-foreground hover:text-foreground"
                  ]
                )}
                onClick={() => handleItemClick(item)}
              >
                {/* Background glow for active item */}
                {isActive && (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-20 blur-xl",
                    item.color
                  )} />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                  isActive ? "bg-white/20 text-white" : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className={cn(
                    "font-semibold text-sm",
                    isActive ? "text-white" : "text-foreground"
                  )}>
                    {item.label}
                  </div>
                  <div className={cn(
                    "text-xs opacity-80",
                    isActive ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </div>
                </div>

                {/* Badge */}
                {item.badge && (
                  <div className={cn(
                    "flex items-center justify-center rounded-full text-xs font-bold shadow-lg animate-pulse",
                    typeof item.badge === 'string' 
                      ? "h-6 px-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white" 
                      : "h-6 w-6 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  )}>
                    {item.badge}
                  </div>
                )}
              </Button>
            </div>
          );
        })}
      </nav>

      {/* Modern Footer */}
      <div className="p-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-secondary/80 via-secondary/60 to-primary/10 backdrop-blur-sm p-6 text-center border border-border/30 shadow-xl overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl" />
          
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl mx-auto mb-3 shadow-lg animate-bounce">
              <Zap className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <p className="font-bold text-sm mb-1 text-foreground">
              Cuidando com Amor ✨
            </p>
            <p className="text-xs text-muted-foreground opacity-80">
              Proteção & carinho 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}