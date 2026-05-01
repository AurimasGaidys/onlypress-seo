"use client"

import { CalendarIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { useState, useRef, useEffect } from "react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface Props {
    startDate: Date | null;
    endDate: Date | null;
    onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const DateRangePicker = (props: Props) => {
    const { startDate, endDate, onDateRangeChange } = props;
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectingStart, setSelectingStart] = useState(true);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
                setSelectingStart(true);
            }
        };

        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        if (selectingStart) {
            // First click - set start date
            onDateRangeChange(date, null);
            setSelectingStart(false);
        } else {
            // Second click - set end date
            if (startDate && date < startDate) {
                // If end date is before start date, swap them
                onDateRangeChange(date, startDate);
            } else {
                onDateRangeChange(startDate, date);
            }
            setShowCalendar(false);
            setSelectingStart(true);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDateRangeChange(null, null);
        setSelectingStart(true);
    };

    const getButtonText = () => {
        if (!startDate && !endDate) {
            return "Filter by Date";
        }
        if (startDate && !endDate) {
            return `From ${format(startDate, 'MMM d, yyyy')} - Select end date`;
        }
        if (startDate && endDate) {
            return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
        }
        return "Filter by Date";
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 px-3 justify-start text-left font-normal bg-background",
                        (startDate || endDate) && "border-primary"
                    )}
                    onClick={() => setShowCalendar(!showCalendar)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate max-w-[200px]">
                        {getButtonText()}
                    </span>
                </Button>
                {(startDate || endDate) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleClear}
                        title="Clear date filter"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {showCalendar && (
                <div 
                    ref={calendarRef}
                    className="absolute top-12 left-0 z-50 bg-popover rounded-lg border shadow-xl p-4"
                >
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium">
                            {selectingStart ? "Select start date" : "Select end date"}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                                setShowCalendar(false);
                                setSelectingStart(true);
                            }}
                        >
                            ×
                        </Button>
                    </div>
                    <Calendar
                        mode="single"
                        selected={selectingStart ? startDate || undefined : endDate || undefined}
                        onSelect={handleDateSelect}
                        initialFocus
                        className="rounded-md border"
                    />
                    {startDate && !endDate && (
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                            Click a date to set the end of the range
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
