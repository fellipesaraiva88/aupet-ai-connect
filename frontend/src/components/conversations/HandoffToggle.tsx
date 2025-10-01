import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HandoffToggleProps {
  conversationId: string;
  currentHandler: 'ai' | 'human' | 'queue';
  aiEnabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export const HandoffToggle: React.FC<HandoffToggleProps> = ({
  conversationId,
  currentHandler,
  aiEnabled,
  onToggle,
  className,
  showLabel = true,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await onToggle(checked);
    } catch (error) {
      console.error('Error toggling handoff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAI = currentHandler === 'ai';
  const isHuman = currentHandler === 'human';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLabel && (
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAI ? (
            <Bot className="h-4 w-4 text-blue-500" />
          ) : (
            <User className="h-4 w-4 text-green-500" />
          )}

          <Badge
            variant={isAI ? 'default' : 'secondary'}
            className={cn(
              'text-xs font-medium',
              isAI && 'bg-blue-100 text-blue-700 border-blue-200',
              isHuman && 'bg-green-100 text-green-700 border-green-200'
            )}
          >
            {isAI && '🤖 IA'}
            {isHuman && '👤 Humano'}
            {currentHandler === 'queue' && '⏳ Fila'}
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Switch
          checked={aiEnabled}
          onCheckedChange={handleToggle}
          disabled={disabled || isLoading}
          className={cn(
            'data-[state=checked]:bg-blue-500',
            'data-[state=unchecked]:bg-green-500'
          )}
        />

        {!showLabel && (
          <span className="text-xs text-muted-foreground">
            {aiEnabled ? 'IA Ativa' : 'Humano'}
          </span>
        )}
      </div>
    </div>
  );
};
