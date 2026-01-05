import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { NewPharmacy } from "@/lib/reportsApi";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewPharmaciesTableProps {
  pharmacies: NewPharmacy[];
  isLoading?: boolean;
}

type SortField =
  | "code"
  | "pharmacyName"
  | "address"
  | "landmark"
  | "phone"
  | "responsiblePhone"
  | "onboardedAt";
type SortDirection = "asc" | "desc";

export function NewPharmaciesTable({
  pharmacies,
  isLoading = false,
}: NewPharmaciesTableProps) {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
              <TableHead className="text-center w-12">
                <div className="font-semibold text-gray-700">№</div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("code")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Код
                  <SortIcon field="code" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("pharmacyName")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Название аптеки
                  <SortIcon field="pharmacyName" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("address")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Адрес
                  <SortIcon field="address" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("landmark")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Ориентир
                  <SortIcon field="landmark" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("phone")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Телефон аптеки
                  <SortIcon field="phone" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("responsiblePhone")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Телефон ответственного
                  <SortIcon field="responsiblePhone" />
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("onboardedAt")}
              >
                <button className="flex items-center font-semibold text-gray-700">
                  Дата ввода
                  <SortIcon field="onboardedAt" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPharmacies.map((pharmacy, index) => (
              <TableRow key={pharmacy.id}>
                <TableCell className="text-center text-sm text-gray-500 w-12">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {pharmacy.code}
                </TableCell>
                <TableCell className="font-medium">
                  {pharmacy.pharmacyName}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {pharmacy.address || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {pharmacy.landmark || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {pharmacy.phone || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {pharmacy.responsiblePhone || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDateTime(pharmacy.onboardedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
