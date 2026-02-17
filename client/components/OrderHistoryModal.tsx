import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Order } from "@/lib/deliveryApi";
import { format } from "date-fns";
import { Clock, CheckCircle2, Package, Truck, MapPin } from "lucide-react";

interface OrderHistoryModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderHistoryModal({ order, isOpen, onClose }: OrderHistoryModalProps) {
    const { t } = useLanguage();

    if (!order) return null;

    // Sort histories by date (newest first)
    const sortedHistories = [...order.histories].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
            case "PICKED_UP":
                return <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
            case "GIVEN_TO_COURIER":
                return <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
            case "READY":
                return <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
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
            CREATED: t.created || "Создан",
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
                                {sortedHistories.map((history, index) => (
                                    <div key={history.id} className="relative flex gap-4">
                                        {/* Icon */}
                                        <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-900 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                            {getStatusIcon(history.newStatus)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {getStatusLabel(history.newStatus)}
                                                    </p>
                                                    {history.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {history.description}
                                                        </p>
                                                    )}
                                                    {history.updater && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                            {history.updater.firstName} {history.updater.lastName}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
                                                    {format(new Date(history.updatedAt), "dd.MM HH:mm")}
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
