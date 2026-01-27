import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ActivityEvent } from "@/lib/reportsApi";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const statusCounts = useMemo(() => {
    return {
      activated: events.filter((e) => e.type === "ACTIVATED").length,
      deactivated: events.filter((e) => e.type === "DEACTIVATED").length,
    };
  }, [events]);

  const handleStatusClick = (status: string) => {
    onStatusChange(selectedStatus === status ? null : status);
  };

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Activated Filter */}
      <Card
        className={`p-6 cursor-pointer transition-all border-2 ${selectedStatus === "ACTIVATED"
            ? "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-700"
            : "border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600"
          }`}
        onClick={() => handleStatusClick("ACTIVATED")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.activated}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {statusCounts.activated}
            </p>
          </div>
          <span className="text-4xl">✅</span>
        </div>
      </Card>

      {/* Deactivated Filter */}
      <Card
        className={`p-6 cursor-pointer transition-all border-2 ${selectedStatus === "DEACTIVATED"
            ? "border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-700"
            : "border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600"
          }`}
        onClick={() => handleStatusClick("DEACTIVATED")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.deactivated}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {statusCounts.deactivated}
            </p>
          </div>
          <span className="text-4xl">⛔</span>
        </div>
      </Card>
    </div>
  );
}
