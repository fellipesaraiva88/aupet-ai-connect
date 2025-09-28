import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ModernCardProps {
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
  variant?: "default" | "gradient" | "glass";
}

export function ModernCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  children,
  variant = "default"
}: ModernCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 sm:p-6 transition-all duration-300",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover-glow animate-slide-up",
        variant === "gradient" && "bg-gradient-to-br from-primary/5 to-accent/5",
        variant === "glass" && "glass-morphism",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dot-pattern" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110 animate-bounce-in">
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          )}>
            <span className={cn(
              "text-xs",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {trend.value}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative">
        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors duration-300 animate-slide-in-from-right">
          {value}
        </div>

        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </div>
  );
}

interface ModernStatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernStatsGrid({ children, className }: ModernStatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
      className
    )}>
      {children}
    </div>
  );
}