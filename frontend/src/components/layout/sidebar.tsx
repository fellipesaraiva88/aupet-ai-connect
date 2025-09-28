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
        "flex h-full w-64 flex-col bg-white/80 backdrop-blur-xl border-r border-border/30",
        className
      )}
    >
      {/* Apple-style Header */}
      <div className="flex h-16 items-center px-6 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10 text-primary animate-apple-spring">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-foreground tracking-[-0.01em]">
              Auzap
            </span>
            <span className="text-[11px] text-muted-foreground font-medium tracking-[-0.005em]">
              Pet Care AI
            </span>
          </div>
        </div>
      </div>

      {/* Apple-style Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-9 px-3 rounded-[8px] font-medium transition-all duration-200",
                "hover:bg-secondary/50 hover:backdrop-blur-sm",
                "animate-apple-fade-in text-[13px] tracking-[-0.01em]",
                isActive && [
                  "bg-primary/8 text-primary shadow-sm",
                  "hover:bg-primary/12",
                  "border border-primary/10"
                ]
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => handleItemClick(item)}
            >
              <Icon className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive ? "scale-105" : "scale-100"
              )} />
              <span className="flex-1 text-left">
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-medium animate-apple-pulse">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Apple-style Footer */}
      <div className="p-3">
        <div className="rounded-[12px] bg-secondary/40 backdrop-blur-sm p-3 text-center border border-border/20">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-[8px] mx-auto mb-2 animate-apple-gentle-hover">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[12px] font-semibold mb-0.5 text-foreground tracking-[-0.01em]">
            Sistema Ativo
          </p>
          <p className="text-[10px] text-muted-foreground tracking-[-0.005em]">
            Monitoramento 24/7
          </p>
        </div>
      </div>
    </div>
  );
}