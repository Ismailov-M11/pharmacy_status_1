import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ActivityEvent } from "@/lib/reportsApi";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface PharmacyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacy?: {
    name: string;
    district: string;
  };
  events: ActivityEvent[];
}

export function PharmacyHistoryModal({
  isOpen,
  onClose,
  pharmacy,
  events,
}: PharmacyHistoryModalProps) {
  const { t } = useLanguage();
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>История аптеки</DialogTitle>
        </DialogHeader>

        {pharmacy && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
            <p className="text-sm text-gray-600">Район: {pharmacy.district}</p>
          </div>
        )}

        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center text-gray-500">Нет событий</p>
          ) : (
            events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline line */}
                {index < events.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                )}

                {/* Timeline dot */}
                <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.type === "ACTIVATED" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                </div>

                {/* Event content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        event.type === "ACTIVATED" ? "default" : "destructive"
                      }
                      className={
                        event.type === "ACTIVATED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {event.type === "ACTIVATED"
                        ? "✅ Активирована"
                        : "⛔ Деактивирована"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(event.time)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Источник: {event.source}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
