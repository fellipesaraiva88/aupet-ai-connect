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
    label: "Nossos Amigos",
    icon: Users,
    href: "/customers",
  },
  {
    id: "pets",
    label: "Pets Queridos",
    icon: Heart,
    href: "/pets",
  },
  {
    id: "appointments",
    label: "Visitas Marcadas",
    icon: Calendar,
    href: "/appointments",
  },
  {
    id: "catalog",
    label: "Nossos Produtos",
    icon: Package,
    href: "/catalog",
  },
  {
    id: "ai-config",
    label: "Assistente IA",
    icon: Bot,
    href: "/ai-config",
  },
  {
    id: "analytics",
    label: "Relatórios",
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

  const handleItemClick = (item: any) => {
    onItemClick?.(item.id);
    if (item.href) {
      navigate(item.href);
    }
  };
  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
            Auzap.Ai
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                isActive &&
                  "bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 shadow-soft"
              )}
              onClick={() => handleItemClick(item)}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className={cn(isActive && "font-medium text-primary")}>
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-full mx-auto mb-2">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium mb-1">💙 Cuidando</p>
          <p className="text-xs text-muted-foreground">
            Sempre atenta aos seus clientes
          </p>
        </div>
      </div>
    </div>
  );
}