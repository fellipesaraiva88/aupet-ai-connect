import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: React.ReactNode;
  hoverContent?: React.ReactNode;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  hoverContent,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn("relative", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {children}

      <AnimatePresence>
        {isHovered && hoverContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-10 bg-popover border rounded-md shadow-lg p-3"
          >
            {hoverContent}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface FeedbackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'success' | 'error' | 'warning' | 'info';
  haptic?: boolean;
  className?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  children,
  onClick,
  variant = 'info',
  haptic = true,
  className
}) => {
  const [clicked, setClicked] = useState(false);

  const variantColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const handleClick = () => {
    setClicked(true);

    // Haptic feedback simulation
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    onClick?.();

    setTimeout(() => setClicked(false), 200);
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-md px-4 py-2 font-medium text-white",
        variantColors[variant],
        className
      )}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {children}

      <AnimatePresence>
        {clicked && (
          <motion.div
            className="absolute inset-0 bg-white/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

interface PulseIndicatorProps {
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  active = true,
  size = 'md',
  color = 'bg-green-500',
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn("rounded-full", sizeClasses[size], color)}
        animate={active ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {active && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full opacity-75",
            sizeClasses[size],
            color
          )}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};

interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 0.6,
  className
}) => {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration * 1000);
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 1,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              width: 400,
              height: 400,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  className
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90'
  };

  return (
    <motion.button
      className={cn(
        "fixed z-50 rounded-full shadow-lg flex items-center justify-center",
        positionClasses[position],
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 10
      }}
    >
      {icon}
    </motion.button>
  );
};

interface CounterAnimationProps {
  value: number;
  duration?: number;
  className?: string;
}

export const CounterAnimation: React.FC<CounterAnimationProps> = ({
  value,
  duration = 1,
  className
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration, displayValue]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};