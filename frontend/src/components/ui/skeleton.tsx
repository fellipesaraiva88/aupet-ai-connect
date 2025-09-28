import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pulse' | 'wave' | 'shimmer' | 'circular' | 'text' | 'button';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

function Skeleton({ className, variant = 'pulse', width, height, lines = 1, ...props }: SkeletonProps) {
  const baseClasses = "rounded-md bg-muted";

  const variantStyles = {
    pulse: "animate-pulse",
    circular: "rounded-full",
    text: "h-4 rounded",
    button: "h-10 rounded-md"
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse",
              baseClasses,
              variantStyles.text,
              index === lines - 1 && "w-3/4",
              className
            )}
            style={style}
            {...props}
          />
        ))}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <motion.div
        className={cn(baseClasses, className)}
        style={style}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        {...props}
      />
    );
  }

  if (variant === 'shimmer') {
    return (
      <div className={cn("relative overflow-hidden", baseClasses, className)} style={style} {...props}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse",
        baseClasses,
        variantStyles[variant as keyof typeof variantStyles] || variantStyles.pulse,
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Skeleton components for specific UI elements
export const ConversationSkeleton: React.FC = () => (
  <div className="p-4 border-b border-border">
    <div className="flex items-start gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" lines={2} />
        <div className="flex gap-2">
          <Skeleton width={60} height={20} />
          <Skeleton width={40} height={20} />
        </div>
      </div>
      <div className="text-right space-y-1">
        <Skeleton width={40} height={16} />
        <Skeleton width={60} height={16} />
      </div>
    </div>
  </div>
);

export const MessageSkeleton: React.FC<{ isFromMe?: boolean }> = ({ isFromMe = false }) => (
  <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      isFromMe ? 'bg-blue-500/20' : 'bg-white/50'
    }`}>
      <Skeleton variant="text" lines={Math.ceil(Math.random() * 3) + 1} />
      <Skeleton width={50} height={12} className="mt-2" />
    </div>
  </div>
);

export const ChatHeaderSkeleton: React.FC = () => (
  <div className="p-4 border-b border-border glass-morphism">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2">
          <Skeleton width={150} height={20} />
          <Skeleton width={120} height={16} />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" width={80} />
        <Skeleton variant="button" width={80} />
        <Skeleton variant="button" width={40} />
      </div>
    </div>
  </div>
);

export const CustomerInfoSkeleton: React.FC = () => (
  <div className="w-80 border-l border-border glass-morphism p-4 space-y-6">
    <div className="text-center space-y-4">
      <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
      <Skeleton width={120} height={20} className="mx-auto" />
      <Skeleton width={100} height={16} className="mx-auto" />
      <div className="flex gap-2 justify-center">
        <Skeleton variant="button" width={60} />
        <Skeleton variant="button" width={80} />
      </div>
    </div>

    <div className="space-y-3">
      <Skeleton width={140} height={20} className="mx-auto" />
      <div className="p-4 glass-morphism rounded-lg space-y-3">
        <Skeleton variant="circular" width={64} height={64} className="mx-auto" />
        <Skeleton width={100} height={18} className="mx-auto" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <Skeleton width={120} height={20} className="mx-auto" />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </div>

    <div className="space-y-2">
      <Skeleton variant="button" className="w-full" />
      <Skeleton variant="button" className="w-full" />
    </div>
  </div>
);

export { Skeleton };
