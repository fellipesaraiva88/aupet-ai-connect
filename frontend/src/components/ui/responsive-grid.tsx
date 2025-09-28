import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: number; // Minimum width per item in pixels
  gap?: number; // Gap between items in pixels
  maxColumns?: number; // Maximum number of columns
  autoFit?: boolean; // Whether to auto-fit based on screen size
}

interface UseResponsiveColumnsProps {
  minItemWidth: number;
  maxColumns: number;
  gap: number;
  containerWidth?: number;
}

// Hook to calculate responsive columns
function useResponsiveColumns({
  minItemWidth,
  maxColumns,
  gap,
  containerWidth
}: UseResponsiveColumnsProps) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const calculateColumns = () => {
      const width = containerWidth || window.innerWidth;

      // Account for typical container padding
      const usableWidth = width - 64; // 32px padding on each side

      // Calculate how many items can fit
      const possibleColumns = Math.floor((usableWidth + gap) / (minItemWidth + gap));

      // Apply maximum constraint
      const finalColumns = Math.min(possibleColumns, maxColumns);

      // Ensure at least 1 column
      setColumns(Math.max(1, finalColumns));
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);

    return () => window.removeEventListener('resize', calculateColumns);
  }, [minItemWidth, maxColumns, gap, containerWidth]);

  return columns;
}

export function ResponsiveGrid({
  children,
  className,
  minItemWidth = 280,
  gap = 24,
  maxColumns = 6,
  autoFit = true
}: ResponsiveGridProps) {
  const columns = useResponsiveColumns({
    minItemWidth,
    maxColumns,
    gap
  });

  if (!autoFit) {
    return (
      <div className={cn("grid gap-6", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("grid w-full", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {children}
    </div>
  );
}

// Predefined responsive layouts
export const ResponsiveLayouts = {
  // For cards (pets, customers, etc.)
  Cards: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid
      minItemWidth={300}
      maxColumns={4}
      gap={24}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),

  // For stats/metrics
  Stats: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid
      minItemWidth={240}
      maxColumns={6}
      gap={20}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),

  // For dashboard widgets
  Dashboard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid
      minItemWidth={320}
      maxColumns={3}
      gap={24}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),

  // For list items
  List: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid
      minItemWidth={400}
      maxColumns={2}
      gap={16}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),

  // For compact items
  Compact: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid
      minItemWidth={200}
      maxColumns={8}
      gap={16}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
};

// Mobile-first breakpoint utilities
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Hook for responsive behavior
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<string>('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= Breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= Breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= Breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= Breakpoints.md) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    current: breakpoint,
    isSmall: breakpoint === 'sm',
    isMedium: breakpoint === 'md',
    isLarge: breakpoint === 'lg',
    isXLarge: breakpoint === 'xl',
    is2XLarge: breakpoint === '2xl',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
    isMobile: ['sm', 'md'].includes(breakpoint)
  };
}

// Container component with responsive padding
export function ResponsiveContainer({
  children,
  className,
  size = 'default'
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-7xl',
    lg: 'max-w-8xl',
    xl: 'max-w-9xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive text sizing
export function ResponsiveText({
  children,
  variant = 'body',
  className
}: {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  className?: string;
}) {
  const variantClasses = {
    heading: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    subheading: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
}

// Responsive spacing utility
export const ResponsiveSpacing = {
  // Vertical spacing
  section: 'space-y-4 sm:space-y-6 lg:space-y-8',
  items: 'space-y-2 sm:space-y-3 lg:space-y-4',
  cards: 'space-y-3 sm:space-y-4 lg:space-y-6',

  // Padding
  container: 'p-4 sm:p-6 lg:p-8',
  card: 'p-3 sm:p-4 lg:p-6',
  sectionPadding: 'py-4 sm:py-6 lg:py-8',

  // Margin
  bottom: 'mb-4 sm:mb-6 lg:mb-8',
  top: 'mt-4 sm:mt-6 lg:mt-8',

  // Gaps
  grid: 'gap-3 sm:gap-4 lg:gap-6',
  flex: 'gap-2 sm:gap-3 lg:gap-4'
};

// Responsive button sizes
export const ResponsiveButton = {
  size: 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
  icon: 'h-4 w-4 sm:h-5 sm:w-5'
};