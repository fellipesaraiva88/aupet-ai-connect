import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'icon';
}

export function ThemeToggle({ className, variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn(
          "relative h-9 w-9 rounded-[10px] hover:bg-secondary/50 transition-all duration-200",
          className
        )}
      >
        <Sun className={cn(
          "h-4 w-4 transition-all duration-300",
          theme === 'dark' ? "rotate-90 scale-0" : "rotate-0 scale-100"
        )} />
        <Moon className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          theme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )} />
        <span className="sr-only">Alternar tema</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 rounded-[10px] border-border/30 hover:bg-secondary/50 transition-all duration-200",
        className
      )}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          <span className="text-[13px] font-medium tracking-[-0.01em]">Modo Escuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span className="text-[13px] font-medium tracking-[-0.01em]">Modo Claro</span>
        </>
      )}
    </Button>
  );
}