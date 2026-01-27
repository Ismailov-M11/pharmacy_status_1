import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  variant = "default",
  className,
}: KpiCardProps) {
  const variantStyles = {
    default: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    danger: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  };

  const valueStyles = {
    default: "text-blue-700 dark:text-blue-300",
    success: "text-green-700 dark:text-green-300",
    danger: "text-red-700 dark:text-red-300",
    warning: "text-yellow-700 dark:text-yellow-300",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className={cn("text-3xl font-bold mt-2", valueStyles[variant])}>
              {value}
            </p>
          </div>
          {icon && <div className="text-3xl opacity-20">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
