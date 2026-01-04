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
    default: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    danger: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const valueStyles = {
    default: "text-blue-700",
    success: "text-green-700",
    danger: "text-red-700",
    warning: "text-yellow-700",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
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
