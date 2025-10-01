import React from 'react';
import { Bot, User, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIStatusIndicatorProps {
  status: 'ai' | 'human' | 'queue' | 'analyzing' | 'generating' | 'sending' | 'attention_needed';
  className?: string;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  needsAttention?: boolean;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  status,
  className,
  showAnimation = true,
  size = 'md',
  needsAttention = false
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ai':
        return {
          icon: <Bot className={sizeClasses[size]} />,
          label: 'IA Ativa',
          color: 'blue',
          pulse: showAnimation
        };
      case 'human':
        return {
          icon: <User className={sizeClasses[size]} />,
          label: 'Atendente',
          color: 'green',
          pulse: false
        };
      case 'queue':
        return {
          icon: <Clock className={sizeClasses[size]} />,
          label: 'Aguardando',
          color: 'yellow',
          pulse: false
        };
      case 'analyzing':
        return {
          icon: <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />,
          label: 'IA analisando...',
          color: 'blue',
          pulse: true
        };
      case 'generating':
        return {
          icon: <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />,
          label: 'IA gerando resposta...',
          color: 'blue',
          pulse: true
        };
      case 'sending':
        return {
          icon: <CheckCircle className={sizeClasses[size]} />,
          label: 'IA enviando...',
          color: 'blue',
          pulse: true
        };
      case 'attention_needed':
        return {
          icon: <AlertCircle className={sizeClasses[size]} />,
          label: 'Atenção Necessária',
          color: 'red',
          pulse: true
        };
      default:
        return {
          icon: <Bot className={sizeClasses[size]} />,
          label: 'IA',
          color: 'gray',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      dot: 'bg-gray-500'
    }
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-2 px-3 py-1',
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <div className="relative">
          {config.icon}
          {config.pulse && (
            <span
              className={cn(
                'absolute -top-1 -right-1 h-2 w-2 rounded-full',
                colors.dot,
                'animate-pulse'
              )}
            />
          )}
        </div>
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>

      {needsAttention && (
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />
          <span className="text-xs text-red-600 font-medium">!</span>
        </div>
      )}
    </div>
  );
};
