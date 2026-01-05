import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityEvent } from "@/lib/reportsApi";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ActivityEventsTableProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  onRowClick?: (event: ActivityEvent) => void;
  onDateClick?: (date: string) => void;
}

type SortField = "code" | "pharmacyName" | "address" | "landmark" | "phone" | "responsiblePhone" | "changeDatetime" | "type";
type SortDirection = "asc" | "desc";

export function ActivityEventsTable({
  events,
  isLoading = false,
  onRowClick,
  onDateClick,
}: ActivityEventsTableProps) {
  const [sortField, setSortField] = useState<SortField>("changeDatetime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "changeDatetime") {
      aVal = new Date(a.changeDatetime).getTime();
      bVal = new Date(b.changeDatetime).getTime();
    } else {
      aVal = aVal?.toString().toLowerCase() || "";
      bVal = (bVal as any)?.toString().toLowerCase() || "";
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Нет событий за выбранный период</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("time")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Дата/время
                  <SortIcon field="time" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("pharmacyName")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Аптека
                  <SortIcon field="pharmacyName" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("type")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Событие
                  <SortIcon field="type" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("district")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Район
                  <SortIcon field="district" />
                </button>
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Источник
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.map((event) => (
              <TableRow
                key={event.id}
                onClick={() => onRowClick?.(event)}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              >
                <TableCell className="font-medium">
                  {formatDateTime(event.time)}
                </TableCell>
                <TableCell>{event.pharmacyName}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{event.district}</TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {event.source}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
