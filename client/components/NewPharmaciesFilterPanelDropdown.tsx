import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

interface NewPharmaciesFilterPanelDropdownProps {
  onFiltersChange: (
    fromDate: Date,
    toDate: Date,
    compareFromDate?: Date | null,
    compareToDate?: Date | null,
  ) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function NewPharmaciesFilterPanelDropdown({
  onFiltersChange,
  onReset,
  isLoading = false,
}: NewPharmaciesFilterPanelDropdownProps) {
  const today = new Date();
  const [mode, setMode] = useState<"months" | "range">("months");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    today.toISOString().slice(0, 7),
  );
  const [compareMonth, setCompareMonth] = useState<string>(
    new Date(today.getFullYear(), today.getMonth() - 1)
      .toISOString()
      .slice(0, 7),
  );
  const [fromDate, setFromDate] = useState<string>(
    today.toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState<string>(
    today.toISOString().split("T")[0],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const months = useMemo(() => {
    const result = [];
    const current = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < 24; i++) {
      const month = new Date(current.getFullYear(), current.getMonth() - i, 1);
      result.push({
        value: month.toISOString().slice(0, 7),
        label: new Intl.DateTimeFormat("ru", {
          year: "numeric",
          month: "long",
        }).format(month),
      });
    }
    return result;
  }, [today]);

  const validateDates = (from: Date, to: Date): boolean => {
    setValidationError(null);

    if (from > to) {
      setValidationError('Дата "С" не может быть позже даты "По"');
      return false;
    }

    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      toast.warning("⚠️ Период больше 366 дней. Показаны данные, но это может быть слишком большой диапазон.");
    }

    return true;
  };

  const handleApply = () => {
    if (mode === "months") {
      const [year, month] = selectedMonth.split("-");
      const from = new Date(parseInt(year), parseInt(month) - 1, 1);
      const to = endOfMonth(from);

      const [compareYear, compareMonth2] = compareMonth.split("-");
      const compareFrom = new Date(parseInt(compareYear), parseInt(compareMonth2) - 1, 1);
      const compareTo = endOfMonth(compareFrom);

      if (validateDates(from, to) && validateDates(compareFrom, compareTo)) {
        onFiltersChange(from, to, compareFrom, compareTo);
      }
    } else {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      if (validateDates(from, to)) {
        onFiltersChange(from, to, null, null);
      }
    }
  };

  const handleReset = () => {
    setMode("months");
    setSelectedMonth(today.toISOString().slice(0, 7));
    setCompareMonth(
      new Date(today.getFullYear(), today.getMonth() - 1)
        .toISOString()
        .slice(0, 7),
    );
    setFromDate(today.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    setValidationError(null);
    onReset();
  };

  return (
    <Card className="p-4 md:p-6 mb-6">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Режим фильтра:
        </label>
        <Select
          value={mode}
          onValueChange={(value) => {
            setMode(value as "months" | "range");
            setValidationError(null);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="months">По месяцам</SelectItem>
            <SelectItem value="range">По периоду</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "months" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Текущий месяц:
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Сравнить с:
            </label>
            <Select value={compareMonth} onValueChange={setCompareMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
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
    </Card>
  );
}
