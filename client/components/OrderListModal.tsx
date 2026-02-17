import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Order, calculateOrderTotalTime, getDeliveryTime } from "@/lib/deliveryApi";
import { format } from "date-fns";

interface OrderListModalProps {
    orders: Order[];
    timeRange: string;
    isOpen: boolean;
    onClose: () => void;
    onOrderClick: (order: Order) => void;
}

export function OrderListModal({
    orders,
    timeRange,
    isOpen,
    onClose,
    onOrderClick,
}: OrderListModalProps) {
    const { t } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {t.orders || "Заказы"}: {timeRange} {t.minutes || "мин"}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t.total || "Всего"}: {orders.length} {t.orders || "заказов"}
                    </p>
                </DialogHeader>

                <div className="mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        №
                                    </th>
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.orderCode}
                                    </th>
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.pharmacyName}
                                    </th>
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.creationTime}
                                    </th>
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.deliveryTime}
                                    </th>
                                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.totalTime}
                                    </th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                        {t.status}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => {
                                    const totalMinutes = calculateOrderTotalTime(order);
                                    const isOnTime = totalMinutes <= 60;

                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => onOrderClick(order)}
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
