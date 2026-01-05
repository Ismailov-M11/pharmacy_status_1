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
import { ActivityEvent } from "@/lib/reportsApi";
import { format, parse } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActivityChartProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  onDateClick?: (date: string) => void;
  fromDate?: Date;
  toDate?: Date;
  selectedDate?: string | null;
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
  fromDate,
  toDate,
  selectedDate = null,
}: ActivityChartProps) {
  const { t } = useLanguage();

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

    // Generate all days in the date range
    const allDays: string[] = [];
    if (fromDate && toDate) {
      let currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        allDays.push(format(currentDate, "yyyy-MM-dd"));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Convert to array - include all days if date range provided
    const dataArray = (allDays.length > 0 ? allDays : Object.keys(groupedByDate))
      .map((dateStr) => {
        try {
          const dateObj = parse(dateStr, "yyyy-MM-dd", new Date());
          const data = groupedByDate[dateStr] || {
            activated: 0,
            deactivated: 0,
          };
          return {
            date: format(dateObj, "dd"),
            fullDate: dateStr,
            activated: data.activated,
            deactivated: data.deactivated,
          };
        } catch (err) {
          console.error("Error parsing date:", dateStr, err);
          return {
            date: dateStr,
            fullDate: dateStr,
            activated: 0,
            deactivated: 0,
          };
        }
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    return dataArray;
  }, [events, fromDate, toDate]);


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
          {t.activitiesChart}
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
          {t.activitiesChart}
        </h2>
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">{t.noActivities}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {t.activitiesChart}
          {fromDate && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({format(fromDate, "LLLL yyyy")})
            </span>
          )}
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
                value: t.eventCount,
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
              name={t.activated}
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data as ChartDataPoint)}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-activated-${index}`}
                  fill={selectedDate === entry.fullDate ? "#059669" : "#10b981"}
                />
              ))}
            </Bar>
            <Bar
              dataKey="deactivated"
              fill="#ef4444"
              name={t.deactivated}
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data as ChartDataPoint)}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-deactivated-${index}`}
                  fill={selectedDate === entry.fullDate ? "#dc2626" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}
