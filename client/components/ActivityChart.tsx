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
import { format, parse } from "date-fns";
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

  const chartData = useMemo(() => {
    // Group events by date
    const groupedByDate: Record<
      string,
      { activated: number; deactivated: number }
    > = {};

    events.forEach((event) => {
      const dateKey = format(new Date(event.changeDatetime), "yyyy-MM-dd");

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
    const dataArray = Object.entries(groupedByDate)
      .map(([dateStr, data]) => {
        try {
          const dateObj = parse(dateStr, "yyyy-MM-dd", new Date());
          return {
            date: format(dateObj, "dd MMM", { locale: undefined }),
            fullDate: dateStr,
            activated: data.activated,
            deactivated: data.deactivated,
          };
        } catch (err) {
          console.error("Error parsing date:", dateStr, err);
          return {
            date: dateStr,
            fullDate: dateStr,
            activated: data.activated,
            deactivated: data.deactivated,
          };
        }
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    return dataArray;
  }, [events]);

  // Get pharmacies for the selected date
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => {
      const dateKey = format(new Date(e.changeDatetime), "yyyy-MM-dd");
      return dateKey === selectedDate;
    });
  }, [selectedDate, events]);

  // Calculate smart Y-axis domain based on max value
  const yAxisDomain = useMemo(() => {
    const maxCount = Math.max(
      ...chartData.map((d) => d.activated + d.deactivated),
      1,
    );

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

  const handleBarClick = (data: ChartDataPoint) => {
    onDateClick?.(data.fullDate);
  };

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
    <div className="mb-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          График активности аптек
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
              formatter={(value) => value}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            <Bar
              dataKey="activated"
              fill="#10b981"
              name="Активировано"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data as ChartDataPoint)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-activated-${index}`}
                  fill={selectedDate === entry.fullDate ? "#059669" : "#10b981"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBarClick(entry)}
                />
              ))}
            </Bar>
            <Bar
              dataKey="deactivated"
              fill="#ef4444"
              name="Деактивировано"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data as ChartDataPoint)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-deactivated-${index}`}
                  fill={selectedDate === entry.fullDate ? "#dc2626" : "#ef4444"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBarClick(entry)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Selected Day Panel */}
      {selectedDate && selectedDayEvents.length > 0 && (
        <Card className="p-6 mt-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              События {format(new Date(selectedDate), "dd.MM.yyyy")}
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
                    Статус
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Время
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedDayEvents.map((event, index) => (
                  <tr
                    key={event.id}
                    className="border-b border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {event.code}
                    </td>
                    <td className="py-2 px-3 text-gray-900">
                      {event.pharmacyName}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {event.address || "—"}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        className={
                          event.type === "ACTIVATED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {event.type === "ACTIVATED"
                          ? "✅ Активирована"
                          : "⛔ Деактивирована"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {format(new Date(event.changeDatetime), "HH:mm")}
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
