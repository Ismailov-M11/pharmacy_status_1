import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Order,
    calculateOrderTotalTime,
    calculateOrderPreparationTime,
    calculateOrderCourierWaitingTime,
    calculateOrderDeliveryTime,
    getDeliveryTime
} from "@/lib/deliveryApi";
import { GenericFilterModal } from "@/components/GenericFilterModal";
import { ExcludeOrdersModal } from "@/components/ExcludeOrdersModal";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Ban } from "lucide-react";

type SortColumn =
    | "code"
    | "pharmacy"
    | "creationDate"
    | "deliveryTime"
    | "preparation"
    | "courierWaiting"
    | "inTransit"
    | "totalTime"
    | null;

type SortDirection = "asc" | "desc" | null;

interface DeliveryDetailsTableProps {
    orders: Order[];
    allOrders: Order[];
    isLoading?: boolean;
    onOrderClick?: (order: Order) => void;
    excludedOrderIds: Set<number>;
    onExcludeChange: (excludedIds: Set<number>) => void;
}

export function DeliveryDetailsTable({
    orders,
    allOrders,
    isLoading,
    onOrderClick,
    excludedOrderIds,
    onExcludeChange,
}: DeliveryDetailsTableProps) {
    const { t } = useLanguage();

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Pharmacy filter state
    const [pharmacyFilterOpen, setPharmacyFilterOpen] = useState(false);
    const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([]);
    const [pharmacySortOrder, setPharmacySortOrder] = useState<'asc' | 'desc' | null>(null);
    const pharmacyFilterRef = useRef<HTMLButtonElement>(null);

    // Exclude modal state
    const [excludeModalOpen, setExcludeModalOpen] = useState(false);

    // Get unique pharmacy names
    const allPharmacyNames = useMemo(() => {
        const names = new Set(orders.map((o) => o.market.name));
        return Array.from(names).sort();
    }, [orders]);

    // Toggle sort on column header click
    const handleSortClick = (column: SortColumn) => {
        if (sortColumn === column) {
            // Cycle: asc → desc → null
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    // Get sort icon for column header
    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
        }
        if (sortDirection === "asc") {
            return <ArrowUp className="h-3 w-3 ml-1 text-purple-600 dark:text-purple-400" />;
        }
        return <ArrowDown className="h-3 w-3 ml-1 text-purple-600 dark:text-purple-400" />;
    };

    // Pharmacy filter handler
    const handlePharmacyFilterApply = (selected: string[], sort: 'asc' | 'desc' | null) => {
        setSelectedPharmacies(selected);
        setPharmacySortOrder(sort);
    };

    // Get sort value for an order by column
    const getSortValue = (order: Order, column: SortColumn): string | number => {
        switch (column) {
            case "code":
                return order.code;
            case "pharmacy":
                return order.market.name;
            case "creationDate":
                return new Date(order.creationDate).getTime();
            case "deliveryTime": {
                const dt = getDeliveryTime(order);
                return dt ? dt.getTime() : 0;
            }
            case "preparation":
                return calculateOrderPreparationTime(order);
            case "courierWaiting":
                return calculateOrderCourierWaitingTime(order);
            case "inTransit":
                return calculateOrderDeliveryTime(order);
            case "totalTime":
                return calculateOrderTotalTime(order);
            default:
                return 0;
        }
    };

    // Filter and sort orders
    const processedOrders = useMemo(() => {
        let result = [...orders];

        // Apply pharmacy filter
        if (selectedPharmacies.length > 0) {
            result = result.filter((o) => selectedPharmacies.includes(o.market.name));
        }

        // Apply pharmacy sort from GenericFilterModal (overrides column sort for pharmacy)
        if (pharmacySortOrder) {
            result.sort((a, b) => {
                const cmp = a.market.name.localeCompare(b.market.name);
                return pharmacySortOrder === "asc" ? cmp : -cmp;
            });
        }
        // Apply column sort
        else if (sortColumn && sortDirection) {
            result.sort((a, b) => {
                const aVal = getSortValue(a, sortColumn);
                const bVal = getSortValue(b, sortColumn);

                let cmp: number;
                if (typeof aVal === "string" && typeof bVal === "string") {
                    cmp = aVal.localeCompare(bVal);
                } else {
                    cmp = (aVal as number) - (bVal as number);
                }

                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [orders, selectedPharmacies, pharmacySortOrder, sortColumn, sortDirection]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        {t.noData}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const sortableHeaderClass =
        "text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-purple-600 dark:hover:text-purple-400 transition-colors";

    return (
        <Card>
            <CardContent className="pt-6">
                {/* Header row with title and exclude button */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t.deliveryDetails}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t.clickRowToSeeHistory || "Нажмите на строку, чтобы увидеть историю"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExcludeModalOpen(true)}
                        className={`gap-2 ${excludedOrderIds.size > 0
                            ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            : ""
                            }`}
                    >
                        <Ban className="h-4 w-4" />
                        {t.excludeOrders || "Исключить"}
                        {excludedOrderIds.size > 0 && (
                            <span className="ml-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium px-1.5 py-0.5 rounded-full">
                                {excludedOrderIds.size}
                            </span>
                        )}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                    {t.number}
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("code")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.orderCode}
                                        {getSortIcon("code")}
                                    </span>
                                </th>
                                <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <span
                                            className="cursor-pointer select-none hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline-flex items-center"
                                            onClick={() => handleSortClick("pharmacy")}
                                        >
                                            {t.pharmacyName}
                                            {getSortIcon("pharmacy")}
                                        </span>
                                        <button
                                            ref={pharmacyFilterRef}
                                            onClick={() => setPharmacyFilterOpen(true)}
                                            className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedPharmacies.length > 0
                                                ? "text-purple-600 dark:text-purple-400"
                                                : "text-gray-400 dark:text-gray-500"
                                                }`}
                                            title={t.filterByPharmacy || "Фильтр по аптеке"}
                                        >
                                            <Filter className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("creationDate")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.creationTime}
                                        {getSortIcon("creationDate")}
                                    </span>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("deliveryTime")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.deliveryTime}
                                        {getSortIcon("deliveryTime")}
                                    </span>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("preparation")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.preparationTime || "Время подготовки"}
                                        {getSortIcon("preparation")}
                                    </span>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("courierWaiting")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.courierWaitingTime || "Ожидание курьера"}
                                        {getSortIcon("courierWaiting")}
                                    </span>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("inTransit")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.deliveryTimeInTransit || "Время в пути"}
                                        {getSortIcon("inTransit")}
                                    </span>
                                </th>
                                <th
                                    className={sortableHeaderClass}
                                    onClick={() => handleSortClick("totalTime")}
                                >
                                    <span className="inline-flex items-center">
                                        {t.totalTime}
                                        {getSortIcon("totalTime")}
                                    </span>
                                </th>
                                <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                    {t.status}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedOrders.map((order, index) => {
                                const totalMinutes = calculateOrderTotalTime(order);
                                const preparationMinutes = calculateOrderPreparationTime(order);
                                const courierWaitingMinutes = calculateOrderCourierWaitingTime(order);
                                const deliveryMinutes = calculateOrderDeliveryTime(order);
                                const isOnTime = totalMinutes <= 60;

                                return (
                                    <tr
                                        key={order.id}
                                        onClick={() => onOrderClick?.(order)}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                                    >
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3 font-medium text-purple-700 dark:text-purple-400">
                                            {order.code}
                                        </td>
                                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100">
                                            {order.market.name}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {format(new Date(order.creationDate), "dd.MM.yyyy HH:mm")}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {(() => {
                                                const deliveryTime = getDeliveryTime(order);
                                                return deliveryTime
                                                    ? format(deliveryTime, "dd.MM.yyyy HH:mm")
                                                    : t.emptyPlaceholder || "—";
                                            })()}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {preparationMinutes > 0 ? `${preparationMinutes} ${t.minutes}` : (t.emptyPlaceholder || "—")}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {courierWaitingMinutes > 0 ? `${courierWaitingMinutes} ${t.minutes}` : (t.emptyPlaceholder || "—")}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {deliveryMinutes > 0 ? `${deliveryMinutes} ${t.minutes}` : (t.emptyPlaceholder || "—")}
                                        </td>
                                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100 font-medium">
                                            {totalMinutes} {t.minutes}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span
                                                className={
                                                    isOnTime
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-red-600 dark:text-red-400"
                                                }
                                                title={isOnTime ? t.onTime : t.late}
                                            >
                                                {isOnTime ? "🟢" : "🔴"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {t.shown}: {processedOrders.length}
                    {selectedPharmacies.length > 0 && (
                        <span className="ml-2 text-purple-600 dark:text-purple-400">
                            ({t.filter}: {selectedPharmacies.length})
                        </span>
                    )}
                </div>
            </CardContent>

            {/* Pharmacy Filter Modal */}
            <GenericFilterModal
                isOpen={pharmacyFilterOpen}
                onClose={() => setPharmacyFilterOpen(false)}
                title={t.filterByPharmacy || "Фильтр по аптеке"}
                allValues={allPharmacyNames}
                selectedValues={selectedPharmacies}
                sortOrder={pharmacySortOrder}
                onApply={handlePharmacyFilterApply}
                triggerElement={pharmacyFilterRef.current}
            />

            {/* Exclude Orders Modal */}
            <ExcludeOrdersModal
                isOpen={excludeModalOpen}
                onClose={() => setExcludeModalOpen(false)}
                orders={allOrders}
                excludedIds={excludedOrderIds}
                onApply={onExcludeChange}
            />
        </Card>
    );
}
