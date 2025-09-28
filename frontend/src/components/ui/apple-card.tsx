import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AppleCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "gradient" | "elevated";
}

export function AppleCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  children,
  variant = "default"
}: AppleCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[20px] border border-border/30 bg-white/95 p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,122,255,0.1)] hover:-translate-y-0.5",
        "backdrop-blur-sm animate-apple-spring",
        variant === "gradient" && "bg-gradient-to-br from-primary/3 to-secondary/50",
        variant === "elevated" && "shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,122,255,0.1),transparent_50%)]" />

      {/* Header with Icon and Trend */}
      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/8 text-primary transition-all duration-300 group-hover:bg-primary/12 group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-[13px] font-medium text-muted-foreground tracking-[-0.01em] mb-0.5">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/60 tracking-[-0.005em]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-[10px] tracking-[-0.01em]",
            trend.isPositive
              ? "bg-green-50/80 text-green-600 border border-green-100/50"
              : "bg-red-50/80 text-red-600 border border-red-100/50"
          )}>
            <span className={cn(
              "text-[10px] leading-none",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {trend.value}
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="relative">
        <div className="text-[28px] font-semibold text-foreground tracking-[-0.02em] mb-2 group-hover:text-primary/90 transition-colors duration-300 animate-apple-slide-in">
          {value}
        </div>

        {children && (
          <div className="mt-5 animate-apple-fade-in">
            {children}
          </div>
        )}
      </div>

      {/* Subtle Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px] pointer-events-none" />
    </div>
  );
}

interface AppleStatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function AppleStatsGrid({ children, className }: AppleStatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6",
      className
    )}>
      {children}
    </div>
  );
}