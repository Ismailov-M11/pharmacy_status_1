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
import { Card } from "@/components/ui/card";
import { NewPharmacy } from "@/lib/reportsApi";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NewPharmaciesTableProps {
  pharmacies: NewPharmacy[];
  isLoading?: boolean;
}

type SortField = "onboardedAt" | "pharmacyName" | "district";
type SortDirection = "asc" | "desc";

export function NewPharmaciesTable({
  pharmacies,
  isLoading = false,
}: NewPharmaciesTableProps) {
  const [sortField, setSortField] = useState<SortField>("onboardedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPharmacies = [...pharmacies].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "onboardedAt") {
      aVal = new Date(a.onboardedAt).getTime();
      bVal = new Date(b.onboardedAt).getTime();
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
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

  if (pharmacies.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Нет новых аптек за выбранный период</p>
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
                onClick={() => handleSort("onboardedAt")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Дата ввода
                  <SortIcon field="onboardedAt" />
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
                onClick={() => handleSort("district")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Район
                  <SortIcon field="district" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("currentStatus")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Статус
                  <SortIcon field="currentStatus" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPharmacies.map((pharmacy) => (
              <TableRow key={pharmacy.id}>
                <TableCell className="font-medium">
                  {formatDateTime(pharmacy.onboardedAt)}
                </TableCell>
                <TableCell>{pharmacy.pharmacyName}</TableCell>
                <TableCell>{pharmacy.district}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pharmacy.currentStatus === "active"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      pharmacy.currentStatus === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {pharmacy.currentStatus === "active"
                      ? "🟢 Активна"
                      : "🔴 Неактивна"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
