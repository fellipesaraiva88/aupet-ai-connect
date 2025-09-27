import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-gradient-card border-border",
    success: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    warning: "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20",
    info: "bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20",
  };

  const changeStyles = {
    positive: "text-success",
    negative: "text-error",
    neutral: "text-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1",
        variantStyles[variant],
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <p className={cn("text-xs font-medium", changeStyles[changeType])}>
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}