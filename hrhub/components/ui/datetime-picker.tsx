"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
}

export function DateTimePicker({
    date,
    setDate,
    placeholder = "Pick date and time",
    className,
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    React.useEffect(() => {
        setSelectedDate(date)
    }, [date])

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return

        const current = selectedDate || new Date()
        const updated = new Date(newDate)
        updated.setHours(current.getHours())
        updated.setMinutes(current.getMinutes())
        updated.setSeconds(current.getSeconds())

        setSelectedDate(updated)
        setDate(updated)
    }

    const handleTimeSelect = (type: 'hours' | 'minutes', value: number) => {
        const current = selectedDate || new Date()
        const updated = new Date(current)

        if (type === 'hours') updated.setHours(value)
        else updated.setMinutes(value)

        setSelectedDate(updated)
        setDate(updated)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex divide-x shadow-2xl" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="flex bg-muted/5">
                    <div className="flex flex-col h-[300px]">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-3 border-b text-center bg-muted/20">Hrs</div>
                        <div
                            className="flex-1 overflow-y-auto w-20 p-1 space-y-1"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {Array.from({ length: 24 }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={selectedDate?.getHours() === i ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "w-full text-xs h-8 rounded-md font-medium transition-all",
                                        selectedDate?.getHours() === i ? "shadow-md scale-105" : "hover:bg-primary/5"
                                    )}
                                    onClick={() => handleTimeSelect('hours', i)}
                                >
                                    {i.toString().padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col h-[300px] border-l divide-x">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-3 border-b text-center bg-muted/20">Min</div>
                        <div
                            className="flex-1 overflow-y-auto w-20 p-1 space-y-1"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {Array.from({ length: 60 }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={selectedDate?.getMinutes() === i ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "w-full text-xs h-8 rounded-md font-medium transition-all",
                                        selectedDate?.getMinutes() === i ? "shadow-md scale-105" : "hover:bg-primary/5"
                                    )}
                                    onClick={() => handleTimeSelect('minutes', i)}
                                >
                                    {i.toString().padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
