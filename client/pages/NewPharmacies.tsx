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
  const [data, setData] = useState<NewPharmaciesResponse | null>(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState<NewPharmacy[]>(
    [],
  );
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadData(fromDate, toDate);
  }, [authLoading, isAuthenticated, navigate]);

  const loadData = async (from: Date, to: Date) => {
    setIsLoading(true);
    try {
      const response = await fetchNewPharmaciesData(from, to);
      setData(response);
      setFilteredPharmacies(response.items);
    } catch (error) {
      console.error("Failed to fetch new pharmacies data:", error);
      toast.error("Ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (from: Date, to: Date, compareMode: boolean) => {
    setFromDate(from);
    setToDate(to);
    loadData(from, to);
  };

  const handleReset = () => {
    const from = startOfMonth(new Date());
    const to = endOfMonth(new Date());
    setFromDate(from);
    setToDate(to);
    loadData(from, to);
  };

  // Calculate top districts
  const topDistricts = useMemo(() => {
    if (!filteredPharmacies.length) return [];

    const districtCounts = filteredPharmacies.reduce(
      (acc, pharmacy) => {
        acc[pharmacy.district] = (acc[pharmacy.district] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(districtCounts)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredPharmacies]);

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
          {/* Filter Panel */}
          <NewPharmaciesFilterPanelDropdown
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {/* KPI Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <KpiCard
                label="🆕 Новых в периоде"
                value={filteredPharmacies.length}
                variant="success"
              />
              <KpiCard
                label="📅 Период сравнения"
                value={data.periodB.count}
                variant="default"
              />
              <KpiCard
                label={`📈 Разница (${data.diff.percent.toFixed(1)}%)`}
                value={
                  data.diff.value >= 0
                    ? `+${data.diff.value}`
                    : `${data.diff.value}`
                }
                variant={data.diff.value >= 0 ? "success" : "danger"}
              />
            </div>
          )}

          {/* New Pharmacies Chart */}
          <NewPharmaciesChart
            pharmacies={filteredPharmacies}
            isLoading={isLoading}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pharmacies Table - Takes 2 columns on desktop */}
            <div className="lg:col-span-2">
              <NewPharmaciesTable
                pharmacies={filteredPharmacies}
                isLoading={isLoading}
              />
            </div>

            {/* Top Districts - Right sidebar on desktop */}
            <div>
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Топ районы по новым аптекам
                </h3>
                {topDistricts.length === 0 ? (
                  <p className="text-gray-500 text-center">Нет данных</p>
                ) : (
                  <div className="space-y-3">
                    {topDistricts.map((item, index) => (
                      <div
                        key={item.district}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {index + 1}. {item.district}
                          </p>
                        </div>
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {item.count}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
