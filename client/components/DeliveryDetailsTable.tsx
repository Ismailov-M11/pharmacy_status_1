import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Order, calculateOrderTotalTime } from "@/lib/deliveryApi";
import { format } from "date-fns";

interface DeliveryDetailsTableProps {
    orders: Order[];
    isLoading?: boolean;
}

export function DeliveryDetailsTable({
    orders,
    isLoading,
}: DeliveryDetailsTableProps) {
    const { t } = useLanguage();

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

    return (
        <Card>
            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {t.deliveryDetails}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                    {t.number}
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
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
                                            {order.code}
                                        </td>
                                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100">
                                            {order.market.name}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {format(new Date(order.creationDate), "dd.MM.yyyy HH:mm")}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                                            {format(new Date(order.deliveredAt), "dd.MM.yyyy HH:mm")}
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
                    {t.shown}: {orders.length}
                </div>
            </CardContent>
        </Card>
    );
}
