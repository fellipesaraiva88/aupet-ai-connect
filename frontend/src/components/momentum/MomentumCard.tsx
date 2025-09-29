import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Thermometer, 
  Snowflake, 
  Clock, 
  MessageCircle, 
  Phone, 
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Star,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MomentumData {
  id: string;
  customerName: string;
  customerPhone: string;
  petName?: string;
  petSpecies?: string;
  lastMessage: string;
  timestamp: string;
  momentum: 'hot' | 'warm' | 'cold';
  score: number; // 0-100
  triggers: string[];
  lastInteraction: string;
  potentialValue: number;
  urgencyLevel: 'high' | 'medium' | 'low';
  nextAction: {
    type: string;
    label: string;
    priority: number;
  };
}

interface MomentumCardProps {
  data: MomentumData;
  onAction: (action: string, data: MomentumData) => void;
  className?: string;
}

const MomentumCard: React.FC<MomentumCardProps> = ({ data, onAction, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMomentumConfig = (momentum: string) => {
    switch (momentum) {
      case 'hot':
        return {
          bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: <Thermometer className="h-5 w-5 text-red-500" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-300',
          badgeVariant: 'destructive' as const,
          pulseAnimation: 'animate-pulse',
        };
      case 'warm':
        return {
          bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          icon: <Heart className="h-5 w-5 text-amber-500" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          badgeVariant: 'secondary' as const,
          pulseAnimation: '',
        };
      case 'cold':
        return {
          bgGradient: 'from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: <Snowflake className="h-5 w-5 text-blue-500" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          badgeVariant: 'outline' as const,
          pulseAnimation: '',
        };
      default:
        return {
          bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: <Heart className="h-5 w-5 text-gray-500" />,
          iconBg: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-700 dark:text-gray-300',
          badgeVariant: 'outline' as const,
          pulseAnimation: '',
        };
    }
  };

  const config = getMomentumConfig(data.momentum);

  const getActionButtons = () => {
    switch (data.momentum) {
      case 'hot':
        return [
          { icon: <ShoppingCart className="h-4 w-4" />, label: 'Finalizar Venda', action: 'close_sale', variant: 'default' as const },
          { icon: <DollarSign className="h-4 w-4" />, label: 'Enviar Orçamento', action: 'send_quote', variant: 'outline' as const },
          { icon: <Calendar className="h-4 w-4" />, label: 'Agendar Urgente', action: 'schedule_urgent', variant: 'outline' as const },
        ];
      case 'warm':
        return [
          { icon: <Heart className="h-4 w-4" />, label: 'Nutrir Relacionamento', action: 'nurture', variant: 'default' as const },
          { icon: <MessageCircle className="h-4 w-4" />, label: 'Enviar Conteúdo', action: 'send_content', variant: 'outline' as const },
          { icon: <Calendar className="h-4 w-4" />, label: 'Propor Consulta', action: 'propose_appointment', variant: 'outline' as const },
        ];
      case 'cold':
        return [
          { icon: <MessageCircle className="h-4 w-4" />, label: 'Iniciar Conversa', action: 'start_conversation', variant: 'default' as const },
          { icon: <Star className="h-4 w-4" />, label: 'Dica do Dia', action: 'send_tip', variant: 'outline' as const },
          { icon: <TrendingUp className="h-4 w-4" />, label: 'Programa Fidelidade', action: 'loyalty', variant: 'outline' as const },
        ];
      default:
        return [];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-300 cursor-pointer hover:shadow-lg",
        `bg-gradient-to-br ${config.bgGradient}`,
        config.borderColor,
        config.pulseAnimation,
        isExpanded ? "row-span-2" : "",
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Compact View */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", config.iconBg)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{data.customerName}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {data.petName && `🐾 ${data.petName}`} • {data.lastInteraction}
                </p>
              </div>
            </div>
            <Badge variant={config.badgeVariant} className="text-xs">
              {data.score}%
            </Badge>
          </div>

          {/* Quick Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data.timestamp}
            </span>
            <span className={cn("font-medium", config.textColor)}>
              {formatCurrency(data.potentialValue)}
            </span>
          </div>

          {/* Last Message Preview */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.lastMessage}
          </p>

          {/* Expanded View */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border/50 animate-fade-in">
              {/* Triggers */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Indicadores de Momentum</h4>
                <div className="flex flex-wrap gap-1">
                  {data.triggers.map((trigger, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Next Action */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Próxima Ação Sugerida</h4>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{data.nextAction.label}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {getActionButtons().map((button, index) => (
                  <Button
                    key={index}
                    variant={button.variant}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(button.action, data);
                    }}
                  >
                    {button.icon}
                    {button.label}
                  </Button>
                ))}
              </div>

              {/* Contact Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('call', data);
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('message', data);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MomentumCard;