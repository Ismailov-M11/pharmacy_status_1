import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { ActivityFilterPanel } from "@/components/ActivityFilterPanel";
import { ActivityEventsTable } from "@/components/ActivityEventsTable";
import { PharmacyHistoryModal } from "@/components/PharmacyHistoryModal";
import {
  fetchActivityData,
  ActivityEvent,
  ActivityResponse,
} from "@/lib/reportsApi";
import { startOfWeek, endOfDay } from "date-fns";
import { toast } from "sonner";

export default function PharmaciesActivity() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(
    startOfWeek(new Date())
  );
  const [toDate, setToDate] = useState<Date>(endOfDay(new Date()));

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
      const response = await fetchActivityData(from, to);
      setData(response);
    } catch (error) {
      console.error("Failed to fetch activity data:", error);
      toast.error("Ошибка при загрузке данных");
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
    const from = startOfWeek(new Date());
    const to = endOfDay(new Date());
    setFromDate(from);
    setToDate(to);
    loadData(from, to);
  };

  const handleRowClick = (event: ActivityEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const pharmacyEvents = selectedEvent
    ? data?.events.filter(
        (e) => e.pharmacyName === selectedEvent.pharmacyName
      ) || []
    : [];

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
          {/* Filter Panel */}
          <ActivityFilterPanel
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

          {/* Events Table */}
          <ActivityEventsTable
            events={data?.events || []}
            isLoading={isLoading}
            onRowClick={handleRowClick}
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
