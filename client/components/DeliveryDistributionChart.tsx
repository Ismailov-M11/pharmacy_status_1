import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { TimeDistribution } from "@/lib/deliveryApi";

interface DeliveryDistributionChartProps {
    distribution: TimeDistribution;
    isLoading?: boolean;
}

export function DeliveryDistributionChart({
    distribution,
    isLoading,
}: DeliveryDistributionChartProps) {
    const { t } = useLanguage();

    const data = [
        { range: "0-30 " + t.minutes, count: distribution["0-30"], key: "0-30" },
        { range: "30-60 " + t.minutes, count: distribution["30-60"], key: "30-60" },
        { range: "60-90 " + t.minutes, count: distribution["60-90"], key: "60-90" },
        { range: "90+ " + t.minutes, count: distribution["90+"], key: "90+" },
    ];

    // Color mapping: green for on-time ranges, yellow/red for late
    const getBarColor = (key: string) => {
        switch (key) {
            case "0-30":
                return "#10b981"; // green-500
            case "30-60":
                return "#84cc16"; // lime-500
            case "60-90":
                return "#f59e0b"; // amber-500
            case "90+":
                return "#ef4444"; // red-500
            default:
                return "#8b5cf6"; // purple-500
        }
    };

    if (isLoading) {
        return (
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {t.deliveryDistribution}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-300 dark:stroke-gray-600"
                        />
                        <XAxis
                            dataKey="range"
                            className="text-gray-600 dark:text-gray-400"
                            tick={{ fill: "currentColor" }}
                        />
                        <YAxis
                            className="text-gray-600 dark:text-gray-400"
                            tick={{ fill: "currentColor" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--tooltip-bg)",
                                border: "1px solid var(--tooltip-border)",
                                borderRadius: "0.5rem",
                            }}
                            labelStyle={{ color: "var(--tooltip-text)" }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.key)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
