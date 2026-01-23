import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onColumnSettingsClick: () => void;
}

export function SettingsMenuModal({
    isOpen,
    onClose,
    onColumnSettingsClick,
}: SettingsMenuModalProps) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t.columnSettings}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-4">
                        <button
                            onClick={() => {
                                onColumnSettingsClick();
                                onClose();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="font-medium text-gray-900">
                                {t.reorderColumns}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {t.dragToReorder}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
