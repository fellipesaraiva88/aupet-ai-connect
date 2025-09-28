import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Loader2,
  Heart,
  Zap,
  Calendar,
  Users
} from "lucide-react";

export interface FeedbackProps {
  type: "success" | "error" | "warning" | "info" | "loading";
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  className?: string;
  duration?: number; // Auto-hide duration in ms
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  progress?: number;
  className?: string;
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    textColor: "text-success",
    iconColor: "text-success"
  },
  error: {
    icon: AlertTriangle,
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
    textColor: "text-destructive",
    iconColor: "text-destructive"
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    textColor: "text-warning",
    iconColor: "text-warning"
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600"
  },
  loading: {
    icon: Loader2,
    bgColor: "bg-muted/50",
    borderColor: "border-muted",
    textColor: "text-muted-foreground",
    iconColor: "text-muted-foreground"
  }
};

// Feedback Banner Component
export function Feedback({
  type,
  title,
  message,
  action,
  onClose,
  className,
  duration,
  icon
}: FeedbackProps) {
  const config = feedbackConfig[type];
  const IconComponent = icon || config.icon;

  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "border-l-4",
        config.bgColor,
        config.borderColor
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <IconComponent className={cn(
                "h-5 w-5",
                config.iconColor,
                type === "loading" && "animate-spin"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={cn("font-medium text-sm", config.textColor)}>
                {title}
              </h4>
              {message && (
                <p className="text-sm text-muted-foreground mt-1">
                  {message}
                </p>
              )}

              {action && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )}
            </div>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-background/80"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty State Component
export function EmptyState({
  icon,
  title,
  message,
  action,
  className
}: EmptyStateProps) {
  const defaultIcon = <Heart className="h-12 w-12 text-muted-foreground/50" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("text-center py-12", className)}
    >
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {message}
      </p>
      {action && (
        <Button
          variant={action.variant || "outline"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Loading State Component
export function LoadingState({
  message = "Carregando...",
  submessage,
  progress,
  className
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("text-center py-12", className)}
    >
      <div className="mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {message}
      </h3>
      {submessage && (
        <p className="text-sm text-muted-foreground mb-4">
          {submessage}
        </p>
      )}
      {progress !== undefined && (
        <div className="max-w-xs mx-auto">
          <div className="w-full bg-secondary rounded-full h-2 mb-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress}% concluído
          </p>
        </div>
      )}
    </motion.div>
  );
}

// Quick Feedback Components for common scenarios
export const PetFeedback = {
  Created: (petName: string, onViewPet?: () => void) => (
    <Feedback
      type="success"
      title={`${petName} foi adicionado à família! 🐾`}
      message="Que alegria conhecer este novo amiguinho! Estamos ansiosos para cuidar dele com muito amor."
      action={onViewPet ? { label: "Ver perfil", onClick: onViewPet } : undefined}
      icon={<Heart className="h-5 w-5" />}
      duration={5000}
    />
  ),

  Updated: (petName: string) => (
    <Feedback
      type="success"
      title={`Informações do ${petName} atualizadas! ✨`}
      message="Perfeito! Agora temos tudo atualizado para oferecer o melhor cuidado."
      icon={<CheckCircle2 className="h-5 w-5" />}
      duration={3000}
    />
  ),

  Error: (message?: string) => (
    <Feedback
      type="error"
      title="Ops, precisamos de um minutinho"
      message={message || "Algo não saiu conforme esperado, mas não se preocupe! Vamos resolver juntos."}
      duration={5000}
    />
  )
};

export const AppointmentFeedback = {
  Scheduled: (petName: string, time: string) => (
    <Feedback
      type="success"
      title="Momento especial agendado! 💖"
      message={`${petName} terá um momento especial de cuidado em ${time}.`}
      icon={<Calendar className="h-5 w-5" />}
      duration={5000}
    />
  ),

  Confirmed: (petName: string) => (
    <Feedback
      type="info"
      title="Agendamento confirmado! ✅"
      message={`O momento de cuidado do ${petName} foi confirmado com sucesso.`}
      icon={<CheckCircle2 className="h-5 w-5" />}
      duration={3000}
    />
  )
};

export const SystemFeedback = {
  Connected: () => (
    <Feedback
      type="success"
      title="Conectado e protegendo! ⚡"
      message="Sistema ativo. Nunca perdemos um cliente."
      icon={<Zap className="h-5 w-5" />}
      duration={2000}
    />
  ),

  NewCustomer: (customerName: string) => (
    <Feedback
      type="info"
      title="Nova família chegou! 👨‍👩‍👧‍👦"
      message={`${customerName} acabou de se juntar à nossa família de clientes.`}
      icon={<Users className="h-5 w-5" />}
      duration={4000}
    />
  )
};

// Empty States for different sections
export const EmptyStates = {
  NoPets: (onAddPet: () => void) => (
    <EmptyState
      icon={<Heart className="h-12 w-12 text-muted-foreground/50" />}
      title="Ainda não há pets aqui"
      message="Que tal começar cadastrando o primeiro pet que conquistou seu coração?"
      action={{ label: "Cadastrar Primeiro Pet", onClick: onAddPet }}
    />
  ),

  NoAppointments: (onSchedule: () => void) => (
    <EmptyState
      icon={<Calendar className="h-12 w-12 text-muted-foreground/50" />}
      title="Nenhum agendamento encontrado"
      message="Comece criando seu primeiro agendamento e transforme momentos em cuidado especial."
      action={{ label: "Criar Primeiro Agendamento", onClick: onSchedule }}
    />
  ),

  NoCustomers: (onAddCustomer: () => void) => (
    <EmptyState
      icon={<Users className="h-12 w-12 text-muted-foreground/50" />}
      title="Sua família de clientes está esperando"
      message="Cada novo cliente é uma nova família que confiará em você. Vamos começar?"
      action={{ label: "Cadastrar Primeira Família", onClick: onAddCustomer }}
    />
  ),

  SearchNoResults: () => (
    <EmptyState
      icon={<Info className="h-8 w-8 text-muted-foreground/50" />}
      title="Nenhum resultado encontrado"
      message="Tente ajustar os filtros ou buscar por outros termos."
    />
  )
};