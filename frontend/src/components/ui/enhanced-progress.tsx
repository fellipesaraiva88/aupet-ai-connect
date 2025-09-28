import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EnhancedProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6'
};

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
};

export const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  label,
  animated = true,
  striped = false,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant],
            striped && "bg-stripes",
            animated && "animate-pulse"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {striped && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>

        {animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  className?: string;
}

const circularVariantColors = {
  default: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  label,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted opacity-20"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={circularVariantColors[variant]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <p className="mt-2 text-sm text-muted-foreground text-center">{label}</p>
      )}
    </div>
  );
};

interface ProgressStepProps {
  steps: Array<{
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepProps> = ({
  steps,
  variant = 'horizontal',
  className
}) => {
  return (
    <div className={cn(
      "flex",
      variant === 'horizontal' ? "items-center space-x-4" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => (
        <div key={index} className={cn(
          "flex items-center",
          variant === 'vertical' && "w-full"
        )}>
          <motion.div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
              step.completed
                ? "bg-primary border-primary text-primary-foreground"
                : step.current
                ? "border-primary text-primary bg-primary/10"
                : "border-muted text-muted-foreground"
            )}
            initial={false}
            animate={{
              scale: step.current ? 1.1 : 1,
              backgroundColor: step.completed ? 'var(--primary)' : step.current ? 'var(--primary-10)' : 'transparent'
            }}
            transition={{ duration: 0.2 }}
          >
            {step.completed ? '✓' : index + 1}
          </motion.div>

          <span className={cn(
            "ml-3 text-sm font-medium",
            step.completed
              ? "text-primary"
              : step.current
              ? "text-foreground"
              : "text-muted-foreground"
          )}>
            {step.label}
          </span>

          {variant === 'horizontal' && index < steps.length - 1 && (
            <motion.div
              className={cn(
                "ml-4 h-0.5 w-12 rounded",
                step.completed ? "bg-primary" : "bg-muted"
              )}
              initial={false}
              animate={{
                backgroundColor: step.completed ? 'var(--primary)' : 'var(--muted)'
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};