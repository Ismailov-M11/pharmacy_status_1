import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ActivityEvent } from "@/lib/reportsApi";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityChartProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  onDateClick?: (date: string) => void;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  activated: number;
  deactivated: number;
}

export function ActivityChart({
  events,
  isLoading = false,
  onDateClick,
}: ActivityChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const chartData = useMemo(() => {
    // Group events by date
    const groupedByDate: Record<
      string,
      { activated: number; deactivated: number }
    > = {};

    events.forEach((event) => {
      const dateKey = format(new Date(event.time), "yyyy-MM-dd");

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { activated: 0, deactivated: 0 };
      }

      if (event.type === "ACTIVATED") {
        groupedByDate[dateKey].activated++;
      } else if (event.type === "DEACTIVATED") {
        groupedByDate[dateKey].deactivated++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date: format(new Date(date), "dd MMM", { locale: undefined }),
        fullDate: date,
        activated: data.activated,
        deactivated: data.deactivated,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [events]);

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          График активности аптек
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse w-full">
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          График активности аптек
        </h2>
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">Нет событий за выбранный период</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        График активности аптек
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            label={{
              value: "Количество событий",
              angle: -90,
              position: "insideLeft",
              offset: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
            cursor={{ fill: "rgba(168, 85, 247, 0.05)" }}
          />
          <Legend />
          <Bar
            dataKey="activated"
            fill="#10b981"
            name="Активировано"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="deactivated"
            fill="#ef4444"
            name="Деактивировано"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
