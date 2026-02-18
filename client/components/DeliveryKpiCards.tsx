import { Clock, Package, Truck, CheckCircle, UserCheck } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { DeliveryMetrics } from "@/lib/deliveryApi";

interface DeliveryKpiCardsProps {
    metrics: DeliveryMetrics;
    isLoading?: boolean;
}

export function DeliveryKpiCards({ metrics, isLoading }: DeliveryKpiCardsProps) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard
                label={t.avgTotalTime}
                value={`${metrics.avgTotalTime} ${t.minutes}`}
                icon={<Clock />}
                variant="default"
            />
            <KpiCard
                label={t.avgPreparationTime}
                value={`${metrics.avgPreparationTime} ${t.minutes}`}
                icon={<Package />}
                variant="warning"
            />
            <KpiCard
                label={t.avgCourierWaitingTime || "Среднее ожидание курьера"}
                value={`${metrics.avgCourierWaitingTime} ${t.minutes}`}
                icon={<UserCheck />}
                variant="default"
            />
            <KpiCard
                label={t.avgDeliveryTime}
                value={`${metrics.avgDeliveryTime} ${t.minutes}`}
                icon={<Truck />}
                variant="success"
            />
            <KpiCard
                label={t.onTimePercentage}
                value={`${metrics.onTimePercentage}%`}
                icon={<CheckCircle />}
                variant={metrics.onTimePercentage >= 80 ? "success" : "danger"}
            />
        </div>
    );
}
