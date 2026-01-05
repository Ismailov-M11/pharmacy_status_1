import React, { useMemo, useState, useRef } from "react";
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
import { NewPharmacy } from "@/lib/reportsApi";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { X } from "lucide-react";
import { ru } from "date-fns/locale";

interface NewPharmaciesChartProps {
  pharmacies: NewPharmacy[];
  isLoading?: boolean;
  fromDate?: Date;
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
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
  onDateClick,
}: NewPharmaciesChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDayPanelRef = useRef<HTMLDivElement>(null);

  // Get month name in Russian
  const monthName = useMemo(() => {
    return format(startOfMonth(fromDate), "LLLL yyyy", { locale: ru });
  }, [fromDate]);

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
      const date = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        day,
      );
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
    onDateClick?.();
    // Scroll to the selected day panel after a brief delay
    setTimeout(() => {
      selectedDayPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
  };

  // Calculate smart Y-axis domain based on max value
  const yAxisDomain = useMemo(() => {
    const maxCount = Math.max(...chartData.map((d) => d.count), 1);

    let tickCount = 5;
    let roundedMax = maxCount;

    if (maxCount <= 10) {
      roundedMax = Math.ceil(maxCount / 2) * 2;
      tickCount = roundedMax / 2 + 1;
    } else if (maxCount <= 50) {
      roundedMax = Math.ceil(maxCount / 10) * 10;
      tickCount = roundedMax / 10 + 1;
    } else if (maxCount <= 100) {
      roundedMax = Math.ceil(maxCount / 20) * 20;
      tickCount = roundedMax / 20 + 1;
    } else if (maxCount <= 500) {
      roundedMax = Math.ceil(maxCount / 50) * 50;
      tickCount = roundedMax / 50 + 1;
    } else {
      roundedMax = Math.ceil(maxCount / 100) * 100;
      tickCount = roundedMax / 100 + 1;
    }

    return [0, roundedMax];
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          График новых аптек — {monthName}
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
          График новых аптек — {monthName}
        </h2>
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">Нет новых аптек за период</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          График новых аптек — {monthName}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                const data = chartData[state.activeTooltipIndex];
                if (data) {
                  handleBarClick(data);
                }
              }
            }}
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
              domain={yAxisDomain}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              type="number"
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
              onClick={(data) => handleBarClick(data as ChartDataPoint)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={selectedDate === entry.fullDate ? "#7c3aed" : "#a855f7"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBarClick(entry)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Selected Day Panel */}
      {selectedDate && selectedDayPharmacies.length > 0 && (
        <Card
          ref={selectedDayPanelRef}
          className="p-6 mt-4 border-blue-200 bg-blue-50 scroll-mt-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Аптеки добавлены {format(new Date(selectedDate), "dd.MM.yyyy")}
            </h3>
            <button
              onClick={handleClosePanel}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-blue-100 hover:text-gray-700 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    №
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Код
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Название
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Адрес
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Телефон
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Время
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedDayPharmacies.map((pharmacy, index) => (
                  <tr
                    key={pharmacy.id}
                    className="border-b border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {pharmacy.code}
                    </td>
                    <td className="py-2 px-3 text-gray-900">
                      {pharmacy.pharmacyName}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {pharmacy.address || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {pharmacy.phone || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {format(new Date(pharmacy.onboardedAt), "HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
