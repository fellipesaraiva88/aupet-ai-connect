import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        loading && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      <motion.div
        className="flex items-center justify-center space-x-2"
        animate={{ opacity: loading ? 0.7 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4" />
            </motion.div>
            {loadingText && (
              <span>{loadingText}</span>
            )}
          </>
        ) : (
          <>
            {icon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
            <span>{children}</span>
          </>
        )}
      </motion.div>

      {loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}
    </Button>
  );
};