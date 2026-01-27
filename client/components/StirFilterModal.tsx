import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, Search } from "lucide-react";

interface StirFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    allStirValues: string[];
    selectedStirs: string[];
    sortOrder: 'asc' | 'desc' | null;
    onApply: (selected: string[], sort: 'asc' | 'desc' | null) => void;
}

export function StirFilterModal({
    isOpen,
    onClose,
    allStirValues,
    selectedStirs,
    sortOrder,
    onApply,
}: StirFilterModalProps) {
    const { t } = useLanguage();
    const [localSelected, setLocalSelected] = useState<string[]>(selectedStirs);
    const [localSort, setLocalSort] = useState<'asc' | 'desc' | null>(sortOrder);
    const [searchQuery, setSearchQuery] = useState("");

    // Update local state when props change
    useMemo(() => {
        setLocalSelected(selectedStirs);
        setLocalSort(sortOrder);
    }, [selectedStirs, sortOrder, isOpen]);

    // Filter STIR values based on search
    const filteredStirs = useMemo(() => {
        return allStirValues.filter(stir =>
            stir.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allStirValues, searchQuery]);

    // Count occurrences of each STIR
    const stirCounts = useMemo(() => {
        const counts = new Map<string, number>();
        allStirValues.forEach(stir => {
            counts.set(stir, (counts.get(stir) || 0) + 1);
        });
        return counts;
    }, [allStirValues]);

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
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t.filterByStir}</DialogTitle>
                </DialogHeader>

                {/* Sort Controls */}
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={localSort === 'asc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLocalSort(localSort === 'asc' ? null : 'asc')}
                        className="flex-1"
                    >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        {t.sortAscending}
                    </Button>
                    <Button
                        variant={localSort === 'desc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLocalSort(localSort === 'desc' ? null : 'desc')}
                        className="flex-1"
                    >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        {t.sortDescending}
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Select/Deselect All */}
                <div className="flex gap-2 mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex-1 text-xs"
                    >
                        {t.selectAll}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="flex-1 text-xs"
                    >
                        {t.deselectAll}
                    </Button>
                </div>

                {/* STIR List */}
                <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {filteredStirs.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                            {t.noResults}
                        </div>
                    ) : (
                        filteredStirs.map((stir) => {
                            const count = stirCounts.get(stir) || 1;
                            return (
                                <label
                                    key={stir}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={localSelected.includes(stir)}
                                        onChange={() => handleToggle(stir)}
                                        className="cursor-pointer"
                                    />
                                    <span className="flex-1 text-sm">{stir}</span>
                                    {count > 1 && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                            x{count}
                                        </span>
                                    )}
                                </label>
                            );
                        })
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleReset}>
                        {t.reset}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            {t.close}
                        </Button>
                        <Button onClick={handleApply}>{t.apply}</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
