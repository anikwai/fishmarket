'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    id,
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(
        value ? new Date(value) : undefined,
    );
    const [month, setMonth] = React.useState<Date | undefined>(
        date || new Date(),
    );
    const [inputValue, setInputValue] = React.useState(
        value ? format(new Date(value), 'yyyy-MM-dd') : '',
    );

    React.useEffect(() => {
        if (value) {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
                setInputValue(format(parsedDate, 'yyyy-MM-dd'));
            }
        } else {
            setDate(undefined);
            setInputValue('');
        }
    }, [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            setInputValue(formattedDate);
            onChange?.(formattedDate);
            setOpen(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        setInputValue(inputVal);

        if (inputVal) {
            const parsedDate = new Date(inputVal);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
                setMonth(parsedDate);
                onChange?.(inputVal);
            }
        } else {
            setDate(undefined);
            onChange?.('');
        }
    };

    return (
        <div className="relative">
            <Input
                id={id}
                type="text"
                value={inputValue}
                placeholder={placeholder}
                className={cn('bg-background pr-10', className)}
                onChange={handleInputChange}
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setOpen(true);
                    }
                }}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            'absolute top-1/2 right-2 size-6 -translate-y-1/2',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={handleDateSelect}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
