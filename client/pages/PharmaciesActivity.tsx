import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { ActivityFilterPanelDropdown } from "@/components/ActivityFilterPanelDropdown";
import { ActivityChart } from "@/components/ActivityChart";
import { ActivityEventsTable } from "@/components/ActivityEventsTable";
import { StatusFilterPanel } from "@/components/StatusFilterPanel";
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const selectedDayRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const today = new Date();
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(today));
  const [toDate, setToDate] = useState<Date>(endOfMonth(today));
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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
    setSelectedStatus(null);
    loadData(from, to);
  };

  // Filter events based on selected status
  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    if (!selectedStatus) return data.events;
    return data.events.filter((e) => e.type === selectedStatus);
  }, [data?.events, selectedStatus]);

  const handleDateClick = (date: string) => {
    setSelectedDateFilter(date);
    // Scroll to the selected day section after a brief delay
    setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // Get events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDateFilter) return [];
    return filteredEvents.filter((e) => {
      const dateKey = e.changeDatetime.split("T")[0];
      return dateKey === selectedDateFilter;
    });
  }, [selectedDateFilter, filteredEvents]);

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
          <h1 className="text-3xl font-bold text-gray-900">
            {t.activitiesTitle}
          </h1>
          <p className="text-gray-600 mt-2">{t.activitiesDescription}</p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Activity Chart - Moved to Top */}
          <ActivityChart
            events={filteredEvents}
            isLoading={isLoading}
            onDateClick={handleDateClick}
            fromDate={fromDate}
            toDate={toDate}
            selectedDate={selectedDateFilter}
          />

          {/* Filter Panel - After Chart */}
          <ActivityFilterPanelDropdown
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {/* Status Filter Panel */}
          <StatusFilterPanel
            events={data?.events || []}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Events Table - Full Month Data */}
          <ActivityEventsTable events={filteredEvents} isLoading={isLoading} />

          {/* Selected Day Events Modal - Centralized Display */}
          {selectedDateFilter && selectedDayEvents.length > 0 && (
            <>
              {/* Modal Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
                onClick={() => setSelectedDateFilter(null)}
              >
                {/* Modal Content */}
                <Card
                  className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border-blue-200 bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-6 border-b border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t.eventsLabel}{" "}
                      {format(new Date(selectedDateFilter), "dd.MM.yyyy")}
                    </h3>
                    <button
                      onClick={() => setSelectedDateFilter(null)}
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
                            {t.status}
                          </th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-700">
                            {t.timeLabel}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDayEvents.map((event, index) => (
                          <tr
                            key={event.id}
                            className="border-b border-blue-100 hover:bg-blue-50 transition-colors"
                          >
                            <td className="py-3 px-3 text-gray-600">
                              {index + 1}
                            </td>
                            <td className="py-3 px-3 font-medium text-gray-900">
                              {event.code}
                            </td>
                            <td className="py-3 px-3 text-gray-900">
                              {event.pharmacyName}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {event.address || "—"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-xl">
                                {event.type === "ACTIVATED" ? "✅" : "⛔"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {format(new Date(event.changeDatetime), "HH:mm")}
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
      </main>
    </div>
  );
}
