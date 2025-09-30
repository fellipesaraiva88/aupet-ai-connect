import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Calendar,
  ShoppingBag,
  Settings,
  TrendingUp,
  Bot,
  QrCode,
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
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "conversations",
    label: "Conversas",
    icon: MessageCircle,
    href: "/conversations",
    badge: 5,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "clients-pets",
    label: "Clientes",
    icon: Users,
    href: "/clients-pets",
    color: "from-sky-500 to-blue-500",
  },
  {
    id: "appointments",
    label: "Agendamentos",
    icon: Calendar,
    href: "/appointments",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "catalog",
    label: "Catálogo",
    icon: ShoppingBag,
    href: "/catalog",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "ai-config",
    label: "Inteligência Artificial",
    icon: Bot,
    href: "/ai-config",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: TrendingUp,
    href: "/analytics",
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    href: "/settings",
    color: "from-slate-500 to-blue-500",
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
        "flex h-full w-64 flex-col bg-background border-r border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 shadow-md">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-foreground">
              Auzap
            </span>
            <span className="text-xs text-muted-foreground">
              Pet Care AI
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 rounded-lg font-medium transition-all",
                isActive ? [
                  "bg-gradient-to-r text-white",
                  `bg-gradient-to-r ${item.color}`
                ] : [
                  "hover:bg-secondary/50",
                  "text-muted-foreground hover:text-foreground"
                ]
              )}
              onClick={() => handleItemClick(item)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-auto text-xs",
                    typeof item.badge === 'string'
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-700"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Quick Actions Footer */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm"
          onClick={() => navigate('/settings')}
        >
          <QrCode className="h-4 w-4" />
          Conectar WhatsApp
        </Button>
      </div>
    </div>
  );
}