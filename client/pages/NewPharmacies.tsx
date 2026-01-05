import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { NewPharmaciesFilterPanelDropdown } from "@/components/NewPharmaciesFilterPanelDropdown";
import { NewPharmaciesChart } from "@/components/NewPharmaciesChart";
import { NewPharmaciesTable } from "@/components/NewPharmaciesTable";
import {
  fetchNewPharmaciesData,
  NewPharmacy,
  NewPharmaciesResponse,
} from "@/lib/reportsApi";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

export default function NewPharmacies() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewPharmaciesResponse | null>(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState<NewPharmacy[]>(
    [],
  );
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [compareFromDate, setCompareFromDate] = useState<Date | null>(null);
  const [compareToDate, setCompareToDate] = useState<Date | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadData(fromDate, toDate, compareFromDate, compareToDate);
  }, [authLoading, isAuthenticated, navigate]);

  const loadData = async (
    from: Date,
    to: Date,
    compareFrom?: Date | null,
    compareTo?: Date | null,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchNewPharmaciesData(
        from,
        to,
        compareFrom || undefined,
        compareTo || undefined,
      );
      setData(response);
      setFilteredPharmacies(response.items);
    } catch (err) {
      console.error("Failed to fetch new pharmacies data:", err);
      const errorMsg = "Ошибка при загрузке данных";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (
    from: Date,
    to: Date,
    compareFrom?: Date | null,
    compareTo?: Date | null,
  ) => {
    setFromDate(from);
    setToDate(to);
    if (compareFrom !== undefined) setCompareFromDate(compareFrom);
    if (compareTo !== undefined) setCompareToDate(compareTo);
    loadData(from, to, compareFrom, compareTo);
  };

  const handleReset = () => {
    const from = startOfMonth(new Date());
    const to = endOfMonth(new Date());
    const prevMonth = new Date(from);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const compareTo = endOfMonth(prevMonth);
    const compareFrom = startOfMonth(prevMonth);

    setFromDate(from);
    setToDate(to);
    setCompareFromDate(compareFrom);
    setCompareToDate(compareTo);
    loadData(from, to, compareFrom, compareTo);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full">
        {/* Header Section */}
        <div className="mb-4 sm:mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <h1 className="text-3xl font-bold text-gray-900">Новые аптеки</h1>
          <p className="text-gray-600 mt-2">
            Аптеки, активированные впервые после обучения
          </p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* New Pharmacies Chart */}
          <NewPharmaciesChart
            pharmacies={filteredPharmacies}
            isLoading={isLoading}
            fromDate={fromDate}
          />

          {/* Filter Panel */}
          <NewPharmaciesFilterPanelDropdown
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {/* KPI Cards */}
          {data && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <KpiCard
                label="🆕 Новых в периоде"
                value={data.periodA.count}
                variant="success"
              />
              <KpiCard
                label="📅 Период сравнения"
                value={data.periodB.count >= 0 ? data.periodB.count : "—"}
                variant="default"
              />
              <KpiCard
                label={`📈 Разница${
                  data.periodB.count > 0
                    ? ` (${data.diff.percent.toFixed(1)}%)`
                    : ""
                }`}
                value={
                  data.diff.value >= 0
                    ? `+${data.diff.value}`
                    : `${data.diff.value}`
                }
                variant={data.diff.value >= 0 ? "success" : "danger"}
              />
            </div>
          )}

          {/* Pharmacies Table */}
          <NewPharmaciesTable
            pharmacies={filteredPharmacies}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
