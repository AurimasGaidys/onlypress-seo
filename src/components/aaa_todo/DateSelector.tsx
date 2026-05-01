import { CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import { useState } from "react";
import { format } from 'date-fns';

interface Props {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

export const PublicationDateSelector = (props: Props) => {
    const { selectedDate, setSelectedDate } = props;
    const [showCalendar, setShowCalendar] = useState(false);

    return <div className="space-y-2 md:col-span-2 relative">
        <Label htmlFor="publication-date">Publication date</Label>
        <div className="flex gap-2">
            {!showCalendar ? (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-2 justify-start text-left font-normal"
                        onClick={() => setShowCalendar(true)}
                    >
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        <span className="truncate">
                            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Date...'}
                        </span>
                    </Button>
                </>
            ) : (
                <div className="absolute top-12 left-0 z-50 bg-white rounded-lg border shadow-xl p-2">
                    <div className="flex justify-end mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setShowCalendar(false)}
                        >
                            ×
                        </Button>
                    </div>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (date) {
                                setSelectedDate(date);
                            }
                            setShowCalendar(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="rounded-md border"
                    />
                </div>
            )}
        </div>
    </div>
}
