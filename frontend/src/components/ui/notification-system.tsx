import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Bell,
  X,
  MessageSquare,
  Calendar,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  Clock
} from "lucide-react";

export type NotificationType =
  | "message"
  | "appointment"
  | "pet_update"
  | "system"
  | "success"
  | "warning"
  | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    customerName?: string;
    petName?: string;
    appointmentTime?: string;
    avatar?: string;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
  onAction?: (notification: Notification) => void;
  className?: string;
}

const notificationIcons = {
  message: MessageSquare,
  appointment: Calendar,
  pet_update: Heart,
  system: Bell,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const notificationColors = {
  message: "text-blue-500",
  appointment: "text-green-500",
  pet_update: "text-pink-500",
  system: "text-gray-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

const priorityColors = {
  low: "border-l-gray-300",
  medium: "border-l-blue-500",
  high: "border-l-red-500",
};

export function NotificationSystem({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onAction,
  className
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (onAction) {
      onAction(notification);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 max-h-[600px] bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notificações</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="text-xs"
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[500px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma notificação no momento</p>
                    <p className="text-xs mt-1">Quando algo importante acontecer, você será avisado aqui</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type];
                      const iconColor = notificationColors[notification.type];
                      const priorityColor = priorityColors[notification.priority];

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={cn(
                            "group relative",
                            !notification.read && "bg-accent/50"
                          )}
                        >
                          <Card
                            className={cn(
                              "border-l-4 cursor-pointer transition-all duration-200 hover:shadow-sm",
                              priorityColor,
                              !notification.read && "bg-accent/20"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                {notification.metadata?.avatar ? (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={notification.metadata.avatar} />
                                    <AvatarFallback>
                                      <Icon className={cn("h-4 w-4", iconColor)} />
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="flex-shrink-0">
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium line-clamp-1">
                                        {notification.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {notification.message}
                                      </p>

                                      {notification.metadata && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                          {notification.metadata.customerName && (
                                            <div className="flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              {notification.metadata.customerName}
                                            </div>
                                          )}
                                          {notification.metadata.petName && (
                                            <div className="flex items-center gap-1">
                                              <Heart className="h-3 w-3" />
                                              {notification.metadata.petName}
                                            </div>
                                          )}
                                          {notification.metadata.appointmentTime && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {notification.metadata.appointmentTime}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRemove(notification.id);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.timestamp)}
                                    </span>

                                    {notification.actionLabel && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNotificationClick(notification);
                                        }}
                                      >
                                        {notification.actionLabel}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t bg-accent/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}