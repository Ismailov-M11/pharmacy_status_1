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
} from "recharts";
import { NewPharmacy } from "@/lib/reportsApi";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { X } from "lucide-react";

interface NewPharmaciesChartProps {
  pharmacies: NewPharmacy[];
  isLoading?: boolean;
  fromDate?: Date;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  count: number;
  day: number;
}

export function NewPharmaciesChart({
  pharmacies,
  isLoading = false,
  fromDate = new Date(),
}: NewPharmaciesChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const chartData = useMemo(() => {
    // Group pharmacies by date
    const groupedByDate: Record<string, NewPharmacy[]> = {};

    pharmacies.forEach((pharmacy) => {
      const dateKey = format(new Date(pharmacy.onboardedAt), "yyyy-MM-dd");
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(pharmacy);
    });

    // Get all days in the selected month
    const monthStart = startOfMonth(fromDate);
    const daysInMonth = getDaysInMonth(monthStart);
    const chartDataArray: ChartDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const dateKey = format(date, "yyyy-MM-dd");
      const count = groupedByDate[dateKey]?.length || 0;

      chartDataArray.push({
        date: format(date, "dd", { locale: undefined }),
        fullDate: dateKey,
        count: count,
        day: day,
      });
    }

    return chartDataArray;
  }, [pharmacies, fromDate]);

  // Get pharmacies for the selected date
  const selectedDayPharmacies = useMemo(() => {
    if (!selectedDate) return [];
    return pharmacies.filter((p) => {
      const dateKey = format(new Date(p.onboardedAt), "yyyy-MM-dd");
      return dateKey === selectedDate;
    });
  }, [selectedDate, pharmacies]);

  const handleBarClick = (data: ChartDataPoint) => {
    setSelectedDate(data.fullDate);
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
  };

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
