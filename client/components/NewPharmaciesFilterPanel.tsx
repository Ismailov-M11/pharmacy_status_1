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
import { startOfMonth, endOfMonth, getMonth, getYear } from "date-fns";

interface NewPharmaciesFilterPanelProps {
  onFiltersChange: (fromDate: Date, toDate: Date, compareMode: boolean) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function NewPharmaciesFilterPanel({
  onFiltersChange,
  onReset,
  isLoading = false,
}: NewPharmaciesFilterPanelProps) {
  const today = new Date();
  const [mode, setMode] = useState<"month" | "range">("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    today.toISOString().slice(0, 7)
  );
  const [compareMonth, setCompareMonth] = useState<string>(
    new Date(today.getFullYear(), today.getMonth() - 1)
      .toISOString()
      .slice(0, 7)
  );
  const [fromDate, setFromDate] = useState<string>(
    today.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(
    today.toISOString().split("T")[0]
  );

  const months = useMemo(() => {
    const result = [];
    const current = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < 12; i++) {
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

  const handleApply = () => {
    if (mode === "month") {
      const [year, month] = selectedMonth.split("-");
      const from = new Date(parseInt(year), parseInt(month) - 1, 1);
      const to = endOfMonth(from);
      onFiltersChange(from, to, true);
    } else {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      onFiltersChange(from, to, false);
    }
  };

  const handleReset = () => {
    setMode("month");
    setSelectedMonth(today.toISOString().slice(0, 7));
    setCompareMonth(
      new Date(today.getFullYear(), today.getMonth() - 1)
        .toISOString()
        .slice(0, 7)
    );
    setFromDate(today.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    onReset();
  };

  return (
    <Card className="p-4 md:p-6 mb-6">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Режим фильтра:
        </label>
        <div className="flex gap-2">
          <Button
            onClick={() => setMode("month")}
            variant={mode === "month" ? "default" : "outline"}
            className={
              mode === "month"
                ? "bg-purple-700 hover:bg-purple-800 text-white flex-1 sm:flex-none"
                : "border-purple-700 text-purple-700 hover:bg-purple-50 flex-1 sm:flex-none"
            }
          >
            По месяцам
          </Button>
          <Button
            onClick={() => setMode("range")}
            variant={mode === "range" ? "default" : "outline"}
            className={
              mode === "range"
                ? "bg-purple-700 hover:bg-purple-800 text-white flex-1 sm:flex-none"
                : "border-purple-700 text-purple-700 hover:bg-purple-50 flex-1 sm:flex-none"
            }
          >
            Период
          </Button>
        </div>
      </div>

      {mode === "month" ? (
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
      )}

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
