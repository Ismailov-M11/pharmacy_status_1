import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Order, calculateOrderTotalTime, calculateOrderPreparationTime, calculateOrderCourierWaitingTime, calculateOrderDeliveryTime } from "@/lib/deliveryApi";
import { format } from "date-fns";
import { Clock, CheckCircle2, Package, Truck, MapPin, Timer } from "lucide-react";

interface OrderHistoryModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderHistoryModal({ order, isOpen, onClose }: OrderHistoryModalProps) {
    const { t } = useLanguage();

    if (!order) return null;

    // Calculate time metrics for this order
    const prepTime = calculateOrderPreparationTime(order);
    const courierWaitTime = calculateOrderCourierWaitingTime(order);
    const deliveryTime = calculateOrderDeliveryTime(order);
    const totalTime = calculateOrderTotalTime(order);

    const formatMinutes = (minutes: number) => {
        if (minutes <= 0) return "—";
        return `${minutes} ${t.minutes || "мин"}`;
    };

    // Build complete history including all entries
    const buildCompleteHistory = () => {
        const completeHistory: Array<{
            status: string;
            updatedAt: string;
            performedBy: string;
            isCreation: boolean;
        }> = [];

        // If no histories, create basic timeline for legacy orders
        if (!order.histories || order.histories.length === 0) {
            // Add completion if deliveredAt exists
            if (order.deliveredAt) {
                completeHistory.push({
                    status: "COMPLETED",
                    updatedAt: order.deliveredAt,
                    performedBy: "",
                    isCreation: false,
                });
            }

            // Add creation
            completeHistory.push({
                status: "CREATED",
                updatedAt: order.creationDate,
                performedBy: `${order.customer.firstName || ""} ${order.customer.lastName || ""} / ${order.location.name}`,
                isCreation: true,
            });

            return completeHistory;
        }

        // Sort histories by date (newest first for display)
        const sortedHistories = [...order.histories].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Add all history entries (including duplicates)
        sortedHistories.forEach((history) => {
            let performedBy = "";

            // Determine who performed the action
            if (history.courierName) {
                // Courier action
                performedBy = history.courierName;
            } else if (history.marketChat?.name) {
                // Pharmacy employee action - show "Pharmacy Name / Employee Name"
                performedBy = `${order.market.name} / ${history.marketChat.name}`;
            } else if (history.updater) {
                // Admin or system user action
                if (history.updater.firstName && history.updater.lastName) {
                    performedBy = `${history.updater.firstName} ${history.updater.lastName}`;
                } else {
                    performedBy = history.updater.phone;
                }
            }

            completeHistory.push({
                status: history.newStatus,
                updatedAt: history.updatedAt,
                performedBy,
                isCreation: false,
            });
        });

        // Add "Order Created" as the last item (oldest)
        completeHistory.push({
            status: "CREATED",
            updatedAt: order.creationDate,
            performedBy: `${order.customer.firstName} ${order.customer.lastName} / ${order.location.name}`,
            isCreation: true,
        });

        return completeHistory;
    };

    const historyItems = buildCompleteHistory();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
            case "PICKED_UP":
                return <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
            case "GIVEN_TO_COURIER":
            case "WAITING_FOR_COURIER":
                return <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
            case "READY":
                return <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
            case "NEW":
            case "CREATED":
            case "CONFIRMED":
                return <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
            default:
                return <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            COMPLETED: t.completed || "Завершен",
            PICKED_UP: t.pickedUp || "Забран",
            GIVEN_TO_COURIER: t.givenToCourier || "Передан курьеру",
            WAITING_FOR_COURIER: t.waitingForCourier || "Ожидание курьера",
            READY: t.ready || "Готов",
            CONFIRMED: t.confirmed || "Подтвержден",
            CREATED: t.orderCreated || "Заказ создан",
            NEW: t.created || "Создан",
        };
        return statusMap[status] || status;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {t.orderHistory || "История заказа"}: {order.code}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Order Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t.pharmacyName}:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{order.market.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t.customer || "Клиент"}:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {order.customer.firstName} {order.customer.lastName}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t.creationTime}:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {format(new Date(order.creationDate), "dd.MM.yyyy HH:mm")}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t.total || "Сумма"}:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {order.invoice.total.toLocaleString()} {t.sum || "сум"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Time Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                            <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">{t.preparationTime || "Подготовка"}</p>
                            <p className="text-sm font-bold text-orange-900 dark:text-orange-100 mt-0.5">{formatMinutes(prepTime)}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                            <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">{t.courierWaitingTime || "Ожидание курьера"}</p>
                            <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mt-0.5">{formatMinutes(courierWaitTime)}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{t.deliveryTimeInTransit || "В пути"}</p>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mt-0.5">{formatMinutes(deliveryTime)}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                            <Timer className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">{t.totalDeliveryTime || "Общее время"}</p>
                            <p className="text-sm font-bold text-green-900 dark:text-green-100 mt-0.5">{formatMinutes(totalTime)}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {t.statusHistory || "История статусов"}
                        </h3>
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                            {/* Timeline items */}
                            <div className="space-y-4">
                                {historyItems.map((item, index) => (
                                    <div key={`${item.status}-${item.updatedAt}-${index}`} className="relative flex gap-4">
                                        {/* Icon */}
                                        <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-900 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                            {getStatusIcon(item.status)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {item.isCreation
                                                            ? t.orderCreated || "Заказ создан"
                                                            : `${t.statusChangedTo || "Статус изменен на"} ${getStatusLabel(item.status)}`}
                                                    </p>
                                                    {item.performedBy && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {t.by || "от"} {item.performedBy}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
                                                    {format(new Date(item.updatedAt), "dd.MM HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
