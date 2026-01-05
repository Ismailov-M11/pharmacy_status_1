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
  Cell,
} from "recharts";
import { NewPharmacy } from "@/lib/reportsApi";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { X } from "lucide-react";
import { ru } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

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
  selectedDate = null,
}: NewPharmaciesChartProps) {
  const { t, language } = useLanguage();
  // Get month name in Russian or Uzbek
  const monthName = useMemo(() => {
    const locale = language === 'uz' ? undefined : ru;
    return format(startOfMonth(fromDate), "LLLL yyyy", { locale });
  }, [fromDate, language]);

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
    onDateClick?.(data.fullDate);
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
          {t.newPharmaciesChart} — {monthName}
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
          {t.newPharmaciesChart} — {monthName}
        </h2>
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">{t.noNewPharmacies}</span>
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
            margin={{ top: 20, right: 30, left: 120, bottom: 60 }}
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

      {/* Selected Day Modal - Centralized Display */}
      {selectedDate && selectedDayPharmacies.length > 0 && (
        <>
          {/* Modal Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
            onClick={() => onDateClick?.(null)}
          >
            {/* Modal Content */}
            <Card
              className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border-blue-200 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-blue-200 bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.pharmaciesAdded}{" "}
                  {format(new Date(selectedDate), "dd.MM.yyyy")}
                </h3>
                <button
                  onClick={() => onDateClick?.(null)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-blue-100 hover:text-gray-700 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-x-auto p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.number}
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.code}
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.pharmacyName}
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.address}
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.phone}
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700">
                        {t.timeLabel}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayPharmacies.map((pharmacy, index) => (
                      <tr
                        key={pharmacy.id}
                        className="border-b border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <td className="py-3 px-3 text-gray-600">{index + 1}</td>
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {pharmacy.code}
                        </td>
                        <td className="py-3 px-3 text-gray-900">
                          {pharmacy.pharmacyName}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {pharmacy.address || "—"}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {pharmacy.phone || "—"}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {format(new Date(pharmacy.onboardedAt), "HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
