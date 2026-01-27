import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StirFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    allStirValues: string[];
    selectedStirs: string[];
    sortOrder: 'asc' | 'desc' | null;
    onApply: (selected: string[], sort: 'asc' | 'desc' | null) => void;
    triggerElement?: HTMLElement | null;
}

export function StirFilterModal({
    isOpen,
    onClose,
    allStirValues,
    selectedStirs,
    sortOrder,
    onApply,
    triggerElement,
}: StirFilterModalProps) {
    const { t } = useLanguage();
    const [localSelected, setLocalSelected] = useState<string[]>(selectedStirs);
    const [localSort, setLocalSort] = useState<'asc' | 'desc' | null>(sortOrder);
    const [searchQuery, setSearchQuery] = useState("");

    // Update local state when props change
    useEffect(() => {
        if (isOpen) {
            setLocalSelected(selectedStirs);
            setLocalSort(sortOrder);
            setSearchQuery("");
        }
    }, [selectedStirs, sortOrder, isOpen]);

    // Filter STIR values based on search
    const filteredStirs = useMemo(() => {
        return allStirValues.filter(stir =>
            stir.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allStirValues, searchQuery]);

    const handleToggle = (stir: string) => {
        setLocalSelected(prev =>
            prev.includes(stir)
                ? prev.filter(s => s !== stir)
                : [...prev, stir]
        );
    };

    const handleSelectAll = () => {
        setLocalSelected(filteredStirs);
    };

    const handleDeselectAll = () => {
        setLocalSelected([]);
    };

    const handleApply = () => {
        onApply(localSelected, localSort);
        onClose();
    };

    const handleReset = () => {
        setLocalSelected([]);
        setLocalSort(null);
        setSearchQuery("");
        onApply([], null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            <div
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 w-80"
                style={{
                    top: triggerElement ? `${triggerElement.getBoundingClientRect().bottom + 5}px` : '50%',
                    left: triggerElement ? `${triggerElement.getBoundingClientRect().left}px` : '50%',
                    transform: triggerElement ? 'none' : 'translate(-50%, -50%)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Sort Controls */}
                <div className="p-3 border-b border-gray-200">
                    <div className="flex gap-2 mb-2">
                        <Button
                            variant={localSort === 'asc' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLocalSort(localSort === 'asc' ? null : 'asc')}
                            className="flex-1 text-xs h-8"
                        >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            {t.sortAscending}
                        </Button>
                        <Button
                            variant={localSort === 'desc' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLocalSort(localSort === 'desc' ? null : 'desc')}
                            className="flex-1 text-xs h-8"
                        >
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {t.sortDescending}
                        </Button>
                    </div>

                    {/* Search */}
                    <Input
                        type="text"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>

                {/* Select/Deselect All */}
                <div className="flex gap-2 px-3 py-2 border-b border-gray-100">
                    <button
                        onClick={handleSelectAll}
                        className="flex-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                        {t.selectAll}
                    </button>
                    <button
                        onClick={handleDeselectAll}
                        className="flex-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                        {t.deselectAll}
                    </button>
                </div>

                {/* STIR List */}
                <div className="max-h-60 overflow-y-auto p-2">
                    {filteredStirs.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 text-sm">
                            {t.noResults}
                        </div>
                    ) : (
                        filteredStirs.map((stir) => (
                            <label
                                key={stir}
                                className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={localSelected.includes(stir)}
                                    onChange={() => handleToggle(stir)}
                                    className="cursor-pointer"
                                />
                                <span className="flex-1 text-sm">{stir}</span>
                            </label>
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-3 border-t border-gray-200">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="flex-1 h-8 text-xs"
                    >
                        {t.reset}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleApply}
                        className="flex-1 h-8 text-xs"
                    >
                        {t.apply}
                    </Button>
                </div>
            </div>
        </div>
    );
}
