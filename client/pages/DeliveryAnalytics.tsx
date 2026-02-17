import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { DeliveryKpiCards } from "@/components/DeliveryKpiCards";
import { DeliveryDistributionChart } from "@/components/DeliveryDistributionChart";
import { DeliveryDetailsTable } from "@/components/DeliveryDetailsTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { OrderListModal } from "@/components/OrderListModal";
import { OrderHistoryModal } from "@/components/OrderHistoryModal";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
    fetchCompletedOrders,
    calculateDeliveryMetrics,
    getTimeDistribution,
    calculateOrderTotalTime,
    Order,
} from "@/lib/deliveryApi";
import { toast } from "sonner";

export default function DeliveryAnalytics() {
    const { isAuthenticated, isLoading: authLoading, token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<{
        from?: Date;
        to?: Date;
    }>({});

    // Modal states
    const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderListModalOpen, setIsOrderListModalOpen] = useState(false);
    const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        loadOrders();
    }, [authLoading, isAuthenticated, navigate]);

    const loadOrders = async (fromDate?: Date, toDate?: Date) => {
        if (!token) return;

        setIsLoading(true);
        try {
            const orders = await fetchCompletedOrders(token, fromDate, toDate);
            setAllOrders(orders);
            setFilteredOrders(orders);
            toast.success(t.saved || "Данные загружены");
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error(t.dataLoadError || "Ошибка при загрузке данных");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateFilterChange = (from: Date | undefined, to: Date | undefined) => {
        setDateFilter({ from, to });

        if (!from || !to) {
            setFilteredOrders(allOrders);
            return;
        }

        const filtered = allOrders.filter((order) => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= from && orderDate <= to;
        });

        setFilteredOrders(filtered);
    };

    const handleResetFilter = () => {
        setDateFilter({});
        setFilteredOrders(allOrders);
    };

    const handleRefresh = () => {
        loadOrders(dateFilter.from, dateFilter.to);
    };

    // Handle chart bar click
    const handleBarClick = (timeRange: string) => {
        setSelectedTimeRange(timeRange);
        setIsOrderListModalOpen(true);
    };

    // Handle order click in modal
    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderHistoryModalOpen(true);
    };

    // Get orders for selected time range
    const ordersInTimeRange = useMemo(() => {
        if (!selectedTimeRange) return [];

        return filteredOrders.filter((order) => {
            const totalTime = calculateOrderTotalTime(order);
            if (totalTime === 0) return false; // Skip invalid orders

            switch (selectedTimeRange) {
                case "0-30":
                    return totalTime <= 30;
                case "30-60":
                    return totalTime > 30 && totalTime <= 60;
                case "60-90":
                    return totalTime > 60 && totalTime <= 90;
                case "90+":
                    return totalTime > 90;
                default:
                    return false;
            }
        });
    }, [selectedTimeRange, filteredOrders]);

    // Calculate metrics from filtered orders
    const metrics = useMemo(
        () => calculateDeliveryMetrics(filteredOrders),
        [filteredOrders]
    );

    const distribution = useMemo(
        () => getTimeDistribution(filteredOrders),
        [filteredOrders]
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-500 dark:text-gray-400">{t.loading}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="w-full">
                {/* Header Section */}
                <div className="mb-4 sm:mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {t.deliveryAnalytics}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {t.deliveryAnalyticsDescription}
                    </p>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 pb-8">
                    {/* Filter and Refresh Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <DateRangeFilter
                            onFilterChange={handleDateFilterChange}
                            onReset={handleResetFilter}
                        />
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            {t.update}
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <DeliveryKpiCards metrics={metrics} isLoading={isLoading} />

                    {/* Distribution Chart */}
                    <DeliveryDistributionChart
                        distribution={distribution}
                        isLoading={isLoading}
                        onBarClick={handleBarClick}
                    />

                    {/* Details Table */}
                    <DeliveryDetailsTable orders={filteredOrders} isLoading={isLoading} />
                </div>
            </main>

            {/* Modals */}
            <OrderListModal
                orders={ordersInTimeRange}
                timeRange={selectedTimeRange || ""}
                isOpen={isOrderListModalOpen}
                onClose={() => setIsOrderListModalOpen(false)}
                onOrderClick={handleOrderClick}
            />

            <OrderHistoryModal
                order={selectedOrder}
                isOpen={isOrderHistoryModalOpen}
                onClose={() => setIsOrderHistoryModalOpen(false)}
            />
        </div>
    );
}

