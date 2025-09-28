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
    default: "bg-gradient-card border-ocean-100/30",
    success: "bg-gradient-to-br from-ocean-50/50 to-ocean-100/30 border-ocean-200/40",
    warning: "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20",
    info: "bg-gradient-to-br from-glacier-50/50 to-glacier-100/40 border-glacier-200/50",
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
            <p className="text-sm font-medium text-ocean-600">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-ocean-800">{value}</p>
            {change && (
              <p className={cn("text-xs font-medium", changeStyles[changeType])}>
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-ocean-100/40 p-2 backdrop-blur-sm hover:bg-ocean-200/40 transition-all duration-300 group-hover:animate-pet-bounce">
              <Icon className="h-5 w-5 text-ocean-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}