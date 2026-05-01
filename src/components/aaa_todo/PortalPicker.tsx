"use client";

import { useState, useMemo } from "react";
import { usePortals } from "@/hooks/usePortals";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalPickerProps {
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
}

export const PortalPicker = (props: PortalPickerProps) => {
    const {
        value,
        onChange,
        disabled = false,
        label = "Portal",
        placeholder = "Select portal...",
        searchPlaceholder = "Search portals..."
    } = props;

    const { portals, loading } = usePortals();
    const [open, setOpen] = useState(false);

    const selectedPortal = useMemo(() => {
        return portals.find(portal => portal.id === value);
    }, [portals, value]);

    const handleClearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="flex-1 justify-between"
                            disabled={loading || disabled}
                        >
                            {loading ? (
                                "Loading portals..."
                            ) : selectedPortal ? (
                                selectedPortal.title
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder={searchPlaceholder} className="outline-none focus:ring-0 focus:ring-offset-0" />
                            <CommandList>
                                <CommandEmpty>No portal found.</CommandEmpty>
                                <CommandGroup>
                                    {portals.map((portal) => (
                                        <CommandItem
                                            key={portal.id}
                                            value={portal.title}
                                            onSelect={() => {
                                                onChange(portal.id);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === portal.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {portal.title}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {value && !disabled && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleClearSelection}
                        title="Clear selection"
                        className="shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};
