import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  addDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
} from "date-fns";

export type DatePreset = "day" | "week" | "month" | "year";

interface ActivityFilterPanelProps {
  onFiltersChange: (fromDate: Date, toDate: Date) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ActivityFilterPanel({
  onFiltersChange,
  onReset,
  isLoading = false,
}: ActivityFilterPanelProps) {
  const today = new Date();

  const [preset, setPreset] = useState<DatePreset>("week");
  const [fromDate, setFromDate] = useState<string>(
    startOfWeek(today).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(
    endOfDay(today).toISOString().split("T")[0]
  );

  const getPresetDates = (p: DatePreset): [Date, Date] => {
    const now = new Date();
    switch (p) {
      case "day":
        return [startOfDay(now), endOfDay(now)];
      case "week":
        return [startOfWeek(now), endOfDay(now)];
      case "month":
        return [startOfMonth(now), endOfDay(now)];
      case "year":
        return [startOfYear(now), endOfDay(now)];
    }
  };

  const handlePresetClick = (p: DatePreset) => {
    setPreset(p);
    const [from, to] = getPresetDates(p);
    setFromDate(from.toISOString().split("T")[0]);
    setToDate(to.toISOString().split("T")[0]);
    onFiltersChange(from, to);
  };

  const handleApply = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    onFiltersChange(from, to);
  };

  const handleReset = () => {
    const [from, to] = getPresetDates("week");
    setFromDate(from.toISOString().split("T")[0]);
    setToDate(to.toISOString().split("T")[0]);
    setPreset("week");
    onReset();
  };

  return (
    <Card className="p-4 md:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Button
          onClick={() => handlePresetClick("day")}
          variant={preset === "day" ? "default" : "outline"}
          className={
            preset === "day"
              ? "bg-purple-700 hover:bg-purple-800 text-white"
              : "border-purple-700 text-purple-700 hover:bg-purple-50"
          }
        >
          День
        </Button>
        <Button
          onClick={() => handlePresetClick("week")}
          variant={preset === "week" ? "default" : "outline"}
          className={
            preset === "week"
              ? "bg-purple-700 hover:bg-purple-800 text-white"
              : "border-purple-700 text-purple-700 hover:bg-purple-50"
          }
        >
          Неделя
        </Button>
        <Button
          onClick={() => handlePresetClick("month")}
          variant={preset === "month" ? "default" : "outline"}
          className={
            preset === "month"
              ? "bg-purple-700 hover:bg-purple-800 text-white"
              : "border-purple-700 text-purple-700 hover:bg-purple-50"
          }
        >
          Месяц
        </Button>
        <Button
          onClick={() => handlePresetClick("year")}
          variant={preset === "year" ? "default" : "outline"}
          className={
            preset === "year"
              ? "bg-purple-700 hover:bg-purple-800 text-white"
              : "border-purple-700 text-purple-700 hover:bg-purple-50"
          }
        >
          Год
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            С:
          </label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            По:
          </label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <Button
          onClick={handleApply}
          disabled={isLoading}
          className="bg-purple-700 hover:bg-purple-800 text-white flex-1 sm:flex-none"
        >
          {isLoading ? "Загрузка..." : "Применить"}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-purple-700 text-purple-700 hover:bg-purple-50 flex-1 sm:flex-none"
        >
          Сброс
        </Button>
      </div>
    </Card>
  );
}
