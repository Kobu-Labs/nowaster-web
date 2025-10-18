"use client";

import * as React from "react";
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { type DateRange } from "react-day-picker";
import { type DeepRequired } from "react-hook-form";

type MonthDatePickerProps = {
  initialDate?: Date;
  onSelected?: (date: DeepRequired<DateRange>) => void;
};

export const MonthDatePicker: React.FC<MonthDatePickerProps> = (props) => {
  const [date, setDate] = React.useState<Date>(props.initialDate ?? new Date());

  const calculateRange = (asOf: Date) => {
    return {
      from: startOfMonth(asOf),
      to: endOfMonth(asOf),
    };
  };

  React.useEffect(() => {
    if (props.onSelected) {
      props.onSelected(calculateRange(date));
    }
  }, []);

  const handlePreviousMonth = () => {
    const newDate = subMonths(date, 1);
    setDate(newDate);
    if (props.onSelected) {
      props.onSelected(calculateRange(newDate));
    }
  };

  const handleNextMonth = () => {
    const newDate = addMonths(date, 1);
    setDate(newDate);
    if (props.onSelected) {
      props.onSelected(calculateRange(newDate));
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(date.getFullYear(), monthIndex);
    setDate(newDate);
    if (props.onSelected) {
      props.onSelected(calculateRange(newDate));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
          variant="outline"
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "MMMM yyyy") : <span>Pick a month</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex items-center justify-between p-2">
          <Button onClick={handlePreviousMonth} size="icon" variant="outline">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="font-semibold">{format(date, "yyyy")}</div>
          <Button onClick={handleNextMonth} size="icon" variant="outline">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2">
          {Array.from({ length: 12 }, (_, i) => (
            <Button
              className="text-sm"
              key={i}
              onClick={() => { handleMonthSelect(i); }}
              variant={date.getMonth() === i ? "default" : "outline"}
            >
              {format(new Date(date.getFullYear(), i), "MMM")}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
