import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
} from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export type DatePreset = "day" | "week" | "month" | "year" | "custom";

interface ActivityFilterPanelDropdownProps {
  onFiltersChange: (fromDate: Date, toDate: Date) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ActivityFilterPanelDropdown({
  onFiltersChange,
  onReset,
  isLoading = false,
}: ActivityFilterPanelDropdownProps) {
  const { t } = useLanguage();
  const today = new Date();

  const [preset, setPreset] = useState<DatePreset>("week");
  const [fromDate, setFromDate] = useState<string>(
    startOfWeek(today).toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState<string>(
    endOfDay(today).toISOString().split("T")[0],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

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
      case "custom":
        return [new Date(fromDate), new Date(toDate)];
    }
  };

  const validateDates = (from: Date, to: Date): boolean => {
    setValidationError(null);

    if (from > to) {
      setValidationError('Дата "С" не может быть позже даты "По"');
      return false;
    }

    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      toast.warning(
        "⚠️ Период больше 366 дней. Показаны данные, но это может быть слишком большой диапазон.",
      );
    }

    return true;
  };

  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    setValidationError(null);
    if (p !== "custom") {
      const [from, to] = getPresetDates(p);
      setFromDate(from.toISOString().split("T")[0]);
      setToDate(to.toISOString().split("T")[0]);
      if (validateDates(from, to)) {
        onFiltersChange(from, to);
      }
    }
  };

  const handleApply = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    if (validateDates(from, to)) {
      onFiltersChange(from, to);
    }
  };

  const handleReset = () => {
    const [from, to] = getPresetDates("week");
    setFromDate(from.toISOString().split("T")[0]);
    setToDate(to.toISOString().split("T")[0]);
    setPreset("week");
    setValidationError(null);
    onReset();
  };

  return (
    <Card className="p-4 md:p-6 mb-6">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Период:
        </label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">День</SelectItem>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="year">Год</SelectItem>
            <SelectItem value="custom">Произвольный</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              С:
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setValidationError(null);
              }}
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
              onChange={(e) => {
                setToDate(e.target.value);
                setValidationError(null);
              }}
              className="w-full"
            />
          </div>
        </div>
      )}

      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {validationError}
        </div>
      )}

      {preset === "custom" && (
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button
            onClick={handleApply}
            disabled={isLoading || !!validationError}
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
      )}
    </Card>
  );
}
