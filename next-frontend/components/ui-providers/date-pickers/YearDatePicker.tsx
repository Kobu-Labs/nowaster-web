"use client";

import * as React from "react";
import { addYears, endOfYear, format, startOfYear, subYears } from "date-fns";
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
import { type FC, useState } from "react";

interface YearDatePickerProps {
  initialDate?: Date;
  onSelected?: (date: DeepRequired<DateRange>) => void;
}

export const YearDatePicker: FC<YearDatePickerProps> = (props) => {
  const [date, setDate] = React.useState<Date>(props.initialDate ?? new Date());

  const calculateRange = (asOf: Date) => ({
    from: startOfYear(asOf),
    to: endOfYear(asOf),
  });

  const handleSelect = (newDate: Date) => {
    setDate(newDate);
    if (props.onSelected) {
      props.onSelected(calculateRange(newDate));
    }
  };

  React.useEffect(() => {
    if (props.onSelected) {
      props.onSelected(calculateRange(date));
    }
  }, []);

  const [years, setYears] = useState(() => Array.from(
    { length: 12 },
    (_, i) => new Date().getFullYear() - 5 + i,
  ));

  const handlePreviousYear = () => {
    const newYear = subYears(date, 1);
    const minYear = years.reduce((latest, current) => Math.min(current, latest));
    if (newYear.getFullYear() < minYear) {
      setYears(() => Array.from(
        { length: 12 },
        (_, i) => newYear.getFullYear() - (11 - i),
      ));

    }
    handleSelect(newYear);
  };

  const handleNextYear = () => {
    const newYear = addYears(date, 1);
    const maxYear = years.reduce((latest, current) => Math.max(current, latest));
    if (newYear.getFullYear() > maxYear) {
      setYears(() => Array.from(
        { length: 12 },
        (_, i) => newYear.getFullYear() + i,
      ));

    }
    handleSelect(newYear);
  };

  const handleYearSelect = (year: number) => {
    handleSelect(new Date(year, 0));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
          variant={"outline"}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? (
            format(date, "yyyy")
          ) : (
            <span>Pick a year</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex items-center justify-between p-2">
          <Button onClick={handlePreviousYear} size="icon" variant="outline">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="font-semibold">
            {format(date, "yyyy")}
          </div>
          <Button onClick={handleNextYear} size="icon" variant="outline">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2">
          {years.map((year) => (
            <Button
              className="text-sm"
              key={year}
              onClick={() => { handleYearSelect(year); }}
              variant={date.getFullYear() === year ? "default" : "outline"}
            >
              {year}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
