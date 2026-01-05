import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { ActivityFilterPanelDropdown } from "@/components/ActivityFilterPanelDropdown";
import { ActivityChart } from "@/components/ActivityChart";
import { ActivityEventsTable } from "@/components/ActivityEventsTable";
import {
  fetchActivityData,
  ActivityEvent,
  ActivityResponse,
} from "@/lib/reportsApi";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { format } from "date-fns";

export default function PharmaciesActivity() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const selectedDayRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );

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
    setError(null);
    try {
      const response = await fetchActivityData(from, to);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch activity data:", err);
      const errorMsg = "Ошибка при загрузке данных";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (from: Date, to: Date) => {
    setFromDate(from);
    setToDate(to);
    loadData(from, to);
  };

  const handleReset = () => {
    const from = startOfMonth(new Date());
    const to = endOfMonth(new Date());
    setFromDate(from);
    setToDate(to);
    setSelectedDateFilter(null);
    loadData(from, to);
  };

  const handleDateClick = (date: string) => {
    setSelectedDateFilter(date);
    // Scroll to the selected day section after a brief delay
    setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const pharmacyEvents = selectedEvent
    ? data?.events.filter(
        (e) => e.pharmacyName === selectedEvent.pharmacyName,
      ) || []
    : [];

  const filteredEvents = selectedDateFilter
    ? data?.events.filter((e) => {
        const dateKey = e.changeDatetime.split("T")[0];
        return dateKey === selectedDateFilter;
      }) || []
    : data?.events || [];

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
          <h1 className="text-3xl font-bold text-gray-900">Активности аптек</h1>
          <p className="text-gray-600 mt-2">
            Просмотр активации и деактивации аптек
          </p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Filter Panel */}
          <ActivityFilterPanelDropdown
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {/* KPI Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <KpiCard
                label="✅ Активировано"
                value={data.summary.activated}
                variant="success"
              />
              <KpiCard
                label="⛔ Деактивировано"
                value={data.summary.deactivated}
                variant="danger"
              />
              <KpiCard
                label="🔄 Чистое изменение"
                value={data.summary.activated - data.summary.deactivated}
                variant={
                  data.summary.activated - data.summary.deactivated >= 0
                    ? "success"
                    : "danger"
                }
              />
            </div>
          )}

          {/* Activity Chart */}
          <ActivityChart
            events={data?.events || []}
            isLoading={isLoading}
            onDateClick={handleDateClick}
          />

          {/* Date Filter Info */}
          {selectedDateFilter && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-blue-900 font-medium">
                Фильтр активирован: показаны события за{" "}
                {new Date(selectedDateFilter).toLocaleDateString("ru-RU")}
              </p>
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Очистить фильтр
              </button>
            </div>
          )}

          {/* Events Table */}
          <ActivityEventsTable
            events={filteredEvents}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            onDateClick={handleDateClick}
          />
        </div>
      </main>

      {/* Pharmacy History Modal */}
      <PharmacyHistoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        pharmacy={
          selectedEvent
            ? {
                name: selectedEvent.pharmacyName,
                district: selectedEvent.district,
              }
            : undefined
        }
        events={pharmacyEvents}
      />
    </div>
  );
}
