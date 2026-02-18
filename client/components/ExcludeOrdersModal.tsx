import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Order } from "@/lib/deliveryApi";

interface ExcludeOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
    excludedIds: Set<number>;
    onApply: (excludedIds: Set<number>) => void;
}

export function ExcludeOrdersModal({
    isOpen,
    onClose,
    orders,
    excludedIds,
    onApply,
}: ExcludeOrdersModalProps) {
    const { t } = useLanguage();
    const [localExcluded, setLocalExcluded] = useState<Set<number>>(new Set(excludedIds));
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            setLocalExcluded(new Set(excludedIds));
            setSearchQuery("");
        }
    }, [isOpen, excludedIds]);

    const filteredOrders = useMemo(() => {
        if (!searchQuery.trim()) return orders;
        const q = searchQuery.toLowerCase();
        return orders.filter(
            (order) =>
                order.id.toString().includes(q) ||
                order.code.toLowerCase().includes(q)
        );
    }, [orders, searchQuery]);

    const handleToggle = (orderId: number) => {
        setLocalExcluded((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const handleApply = () => {
        onApply(localExcluded);
        onClose();
    };

    const handleReset = () => {
        setLocalExcluded(new Set());
        onApply(new Set());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[420px] max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {t.excludeOrdersTitle || "Исключить заказы"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <Input
                        type="text"
                        placeholder={t.enterOrderId || "Введите ID или код заказа"}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 text-sm"
                    />
                    {localExcluded.size > 0 && (
                        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                            {t.excluded || "Исключено"}: {localExcluded.size}
                        </div>
                    )}
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-2 min-h-0 max-h-[400px]">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                            {t.noOrdersFound || "Заказы не найдены"}
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <label
                                key={order.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${localExcluded.has(order.id)
                                        ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={localExcluded.has(order.id)}
                                    onChange={() => handleToggle(order.id)}
                                    className="cursor-pointer accent-red-500 h-4 w-4 flex-shrink-0"
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        #{order.id} — {order.code}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {order.market.name}
                                    </span>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="flex-1 h-9 text-sm"
                    >
                        {t.reset}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleApply}
                        className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                        {t.apply}
                    </Button>
                </div>
            </div>
        </div>
    );
}
