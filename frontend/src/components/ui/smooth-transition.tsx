import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface SmoothTransitionProps {
  children: React.ReactNode;
  show: boolean;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
  duration?: number;
  delay?: number;
  className?: string;
}

const variants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  }
};

export const SmoothTransition: React.FC<SmoothTransitionProps> = ({
  children,
  show,
  variant = 'fade',
  duration = 0.3,
  delay = 0,
  className
}) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          variants={variants[variant]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration,
            delay,
            ease: "easeOut"
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const FadeTransition: React.FC<Omit<SmoothTransitionProps, 'variant'>> = (props) => (
  <SmoothTransition {...props} variant="fade" />
);

export const SlideTransition: React.FC<Omit<SmoothTransitionProps, 'variant'>> = (props) => (
  <SmoothTransition {...props} variant="slide" />
);

export const ScaleTransition: React.FC<Omit<SmoothTransitionProps, 'variant'>> = (props) => (
  <SmoothTransition {...props} variant="scale" />
);

// Staggered children animation
interface StaggeredChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggeredChildren: React.FC<StaggeredChildrenProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => {
  const containerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const childVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={childVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
};