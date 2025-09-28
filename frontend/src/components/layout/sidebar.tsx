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
} from "lucide-react";

interface SidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    id: "conversations",
    label: "Conversas",
    icon: MessageSquare,
    href: "/conversations",
    badge: 5,
  },
  {
    id: "customers",
    label: "Clientes",
    icon: Users,
    href: "/customers",
  },
  {
    id: "pets",
    label: "Pets",
    icon: Heart,
    href: "/pets",
  },
  {
    id: "appointments",
    label: "Agendamentos",
    icon: Calendar,
    href: "/appointments",
  },
  {
    id: "catalog",
    label: "Catálogo",
    icon: Package,
    href: "/catalog",
  },
  {
    id: "ai-config",
    label: "Configuração IA",
    icon: Bot,
    href: "/ai-config",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    href: "/settings",
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
        "flex h-full w-64 flex-col bg-white/95 backdrop-blur-sm border-r border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg animate-gentle-float">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-foreground tracking-tight">
              Auzap
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Pet Care AI
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 px-3 rounded-xl font-medium transition-all duration-200",
                "hover:bg-secondary/60 hover:shadow-sm hover:scale-[1.02]",
                "animate-fade-in",
                isActive && [
                  "bg-primary text-primary-foreground shadow-lg",
                  "hover:bg-primary hover:shadow-xl",
                  "transform scale-[1.02]"
                ]
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleItemClick(item)}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "scale-110" : "scale-100"
              )} />
              <span className="text-sm">
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white font-semibold animate-pulse-soft">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 p-4 text-center border border-border/30">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-3 shadow-lg animate-gentle-float">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-semibold mb-1 text-foreground">
            Sistema Ativo
          </p>
          <p className="text-xs text-muted-foreground">
            Monitoramento 24/7
          </p>
        </div>
      </div>
    </div>
  );
}