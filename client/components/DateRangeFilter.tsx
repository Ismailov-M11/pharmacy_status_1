import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
    onFilterChange: (from: Date | undefined, to: Date | undefined) => void;
    onReset: () => void;
}

export function DateRangeFilter({
    onFilterChange,
    onReset,
}: DateRangeFilterProps) {
    const { t } = useLanguage();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const handleApply = () => {
        if (dateRange?.from && dateRange?.to) {
            onFilterChange(dateRange.from, dateRange.to);
        } else if (dateRange?.from) {
            onFilterChange(dateRange.from, dateRange.from);
        }
    };

    const handleReset = () => {
        setDateRange(undefined);
        onReset();
    };

    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "dd.MM.yyyy")} -{" "}
                                    {format(dateRange.to, "dd.MM.yyyy")}
                                </>
                            ) : (
                                format(dateRange.from, "dd.MM.yyyy")
                            )
                        ) : (
                            <span>{t.selectPeriod}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        initialFocus
                    />
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <Button onClick={handleApply} size="sm" className="flex-1">
                            {t.apply}
                        </Button>
                        <Button
                            onClick={handleReset}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                        >
                            {t.reset}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
