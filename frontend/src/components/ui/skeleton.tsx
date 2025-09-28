import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pulse' | 'wave' | 'shimmer';
}

function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  const baseClasses = "rounded-md bg-muted";

  if (variant === 'pulse') {
    return <div className={cn("animate-pulse", baseClasses, className)} {...props} />;
  }

  if (variant === 'wave') {
    return (
      <motion.div
        className={cn(baseClasses, className)}
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
      <div className={cn("relative overflow-hidden", baseClasses, className)} {...props}>
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

  return <div className={cn("animate-pulse", baseClasses, className)} {...props} />;
}

export { Skeleton };
