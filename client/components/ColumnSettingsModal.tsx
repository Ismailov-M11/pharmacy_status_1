import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Eye, EyeOff, X } from "lucide-react";

export interface ColumnConfig {
    id: string;
    label: string;
    visible: boolean;
    order: number;
}

interface ColumnSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: ColumnConfig[];
    onSave: (columns: ColumnConfig[]) => void;
}

export function ColumnSettingsModal({
    isOpen,
    onClose,
    columns,
    onSave,
}: ColumnSettingsModalProps) {
    const { t } = useLanguage();
    const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalColumns([...columns].sort((a, b) => a.order - b.order));
        }
    }, [isOpen, columns]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newColumns = [...localColumns];
        const draggedItem = newColumns[draggedIndex];
        newColumns.splice(draggedIndex, 1);
        newColumns.splice(index, 0, draggedItem);

        // Update order
        newColumns.forEach((col, idx) => {
            col.order = idx;
        });

        setLocalColumns(newColumns);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const toggleVisibility = (id: string) => {
        setLocalColumns(
            localColumns.map((col) =>
                col.id === id ? { ...col, visible: !col.visible } : col
            )
        );
    };

    const handleSave = () => {
        onSave(localColumns);
        onClose();
    };

    const handleReset = () => {
        const resetColumns = columns.map((col, index) => ({
            ...col,
            visible: true,
            order: index,
        }));
        setLocalColumns(resetColumns);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{t.columnSettings}</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-6 w-6"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-2">{t.reorderColumns}</h3>
                        <p className="text-xs text-gray-500 mb-4">{t.dragToReorder}</p>
                    </div>

                    <div className="space-y-2">
                        {localColumns.map((column, index) => (
                            <div
                                key={column.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:bg-gray-50 transition-colors ${draggedIndex === index ? "opacity-50" : ""
                                    }`}
                            >
                                <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />

                                <span className="text-sm font-medium text-gray-500 w-8">
                                    {index + 1}.
                                </span>

                                <span className="flex-1 text-sm font-medium">
                                    {column.label}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleVisibility(column.id)}
                                    className={`gap-2 ${column.visible
                                            ? "text-blue-600 hover:text-blue-700"
                                            : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    {column.visible ? (
                                        <>
                                            <Eye className="h-4 w-4" />
                                            <span className="text-xs">{t.hideColumn}</span>
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="h-4 w-4" />
                                            <span className="text-xs">{t.showColumn}</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleReset}>
                        {t.resetToDefault}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            {t.cancel}
                        </Button>
                        <Button onClick={handleSave}>{t.saveChanges}</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
