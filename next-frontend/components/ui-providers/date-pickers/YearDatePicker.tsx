"use client";

import * as React from "react";
import { format, addYears, subYears, startOfYear, endOfYear } from "date-fns";
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
import { useState, type FC } from "react";

type YearDatePickerProps = {
  onSelected?: (date: DeepRequired<DateRange>) => void;
  initialDate?: Date;
};

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
    const minYear = years.reduce((latest, current) => current < latest ? current : latest);
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
    const maxYear = years.reduce((latest, current) => current > latest ? current : latest);
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
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? (
            format(date, "yyyy")
          ) : (
            <span>Pick a year</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between p-2">
          <Button variant="outline" size="icon" onClick={handlePreviousYear}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="font-semibold">
            {format(date, "yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextYear}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={date.getFullYear() === year ? "default" : "outline"}
              className="text-sm"
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
