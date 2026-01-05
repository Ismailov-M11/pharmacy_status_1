import React, { useMemo } from "react";
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
} from "recharts";
import { NewPharmacy } from "@/lib/reportsApi";
import { format } from "date-fns";

interface NewPharmaciesChartProps {
  pharmacies: NewPharmacy[];
  isLoading?: boolean;
}

export function NewPharmaciesChart({
  pharmacies,
  isLoading = false,
}: NewPharmaciesChartProps) {
  const chartData = useMemo(() => {
    // Group pharmacies by date and count total
    const groupedByDate: Record<string, number> = {};

    pharmacies.forEach((pharmacy) => {
      const dateKey = format(new Date(pharmacy.onboardedAt), "yyyy-MM-dd");
      groupedByDate[dateKey] = (groupedByDate[dateKey] || 0) + 1;
    });

    // Convert to array and sort by date
    return Object.entries(groupedByDate)
      .map(([date, count]) => ({
        date: format(new Date(date), "dd MMM", { locale: undefined }),
        fullDate: date,
        count: count,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [pharmacies]);

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          График новых аптек
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
          График новых аптек
        </h2>
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">Нет новых аптек за период</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        График новых аптек
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
              value: "Количество аптек",
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
            formatter={(value) => value}
            labelFormatter={(label) => `${label}`}
          />
          <Bar
            dataKey="count"
            fill="#a855f7"
            name="Новые аптеки"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
