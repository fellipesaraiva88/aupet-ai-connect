import { useState, useEffect, useCallback } from "react";
import { Notification, NotificationType } from "@/components/ui/notification-system";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications

    // Auto-remove low priority notifications after 30 seconds
    if (notificationData.priority === 'low') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 30000);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate real-time notifications for demo
  useEffect(() => {
    const simulateNotifications = () => {
      const demoNotifications = [
        {
          type: "message" as NotificationType,
          title: "Nova conversa",
          message: "Maria Silva está interessada em agendar um banho para o Rex",
          priority: "medium" as const,
          metadata: {
            customerName: "Maria Silva",
            petName: "Rex"
          }
        },
        {
          type: "appointment" as NotificationType,
          title: "Agendamento confirmado",
          message: "Consulta veterinária para Luna confirmada para amanhã às 14h",
          priority: "high" as const,
          metadata: {
            customerName: "João Santos",
            petName: "Luna",
            appointmentTime: "14:00"
          }
        },
        {
          type: "pet_update" as NotificationType,
          title: "Lembrete de vacinação",
          message: "Buddy precisa da segunda dose da vacina antirrábica",
          priority: "medium" as const,
          metadata: {
            petName: "Buddy"
          }
        },
        {
          type: "success" as NotificationType,
          title: "Pet cadastrado",
          message: "Novo amiguinho Max foi adicionado com sucesso!",
          priority: "low" as const,
          metadata: {
            petName: "Max"
          }
        }
      ];

      // Add a random notification every 30-60 seconds
      const randomDelay = Math.random() * 30000 + 30000;
      setTimeout(() => {
        const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
        addNotification(randomNotification);
        simulateNotifications(); // Schedule next notification
      }, randomDelay);
    };

    // Start simulation after 5 seconds
    const initialTimeout = setTimeout(simulateNotifications, 5000);

    return () => clearTimeout(initialTimeout);
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
}