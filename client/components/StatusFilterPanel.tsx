import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ActivityEvent } from "@/lib/reportsApi";

interface StatusFilterPanelProps {
  events: ActivityEvent[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export function StatusFilterPanel({
  events,
  selectedStatus,
  onStatusChange,
}: StatusFilterPanelProps) {
  const statusCounts = useMemo(() => {
    return {
      activated: events.filter((e) => e.type === "ACTIVATED").length,
      deactivated: events.filter((e) => e.type === "DEACTIVATED").length,
      clean: events.filter((e) => e.type === "CLEAN").length,
    };
  }, [events]);

  const handleStatusClick = (status: string) => {
    onStatusChange(selectedStatus === status ? null : status);
  };

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Activated Filter */}
      <Card
        className={`p-6 cursor-pointer transition-all border-2 ${
          selectedStatus === "ACTIVATED"
            ? "border-green-500 bg-green-50"
            : "border-green-100 bg-green-50 hover:border-green-300"
        }`}
        onClick={() => handleStatusClick("ACTIVATED")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Активирована</p>
            <p className="text-2xl font-bold text-green-700">
              {statusCounts.activated}
            </p>
          </div>
          <span className="text-4xl">✅</span>
        </div>
      </Card>

      {/* Deactivated Filter */}
      <Card
        className={`p-6 cursor-pointer transition-all border-2 ${
          selectedStatus === "DEACTIVATED"
            ? "border-red-500 bg-red-50"
            : "border-red-100 bg-red-50 hover:border-red-300"
        }`}
        onClick={() => handleStatusClick("DEACTIVATED")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Деактивирована</p>
            <p className="text-2xl font-bold text-red-700">
              {statusCounts.deactivated}
            </p>
          </div>
          <span className="text-4xl">⛔</span>
        </div>
      </Card>

      {/* Clean Change Filter */}
      <Card
        className={`p-6 cursor-pointer transition-all border-2 ${
          selectedStatus === "CLEAN"
            ? "border-teal-500 bg-teal-50"
            : "border-teal-100 bg-teal-50 hover:border-teal-300"
        }`}
        onClick={() => handleStatusClick("CLEAN")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Чистое изменение</p>
            <p className="text-2xl font-bold text-teal-700">
              {statusCounts.clean}
            </p>
          </div>
          <span className="text-4xl">🔄</span>
        </div>
      </Card>
    </div>
  );
}
