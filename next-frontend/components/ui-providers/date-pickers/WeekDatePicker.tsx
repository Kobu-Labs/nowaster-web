import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";

import { type FC, useMemo } from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/shadcn/calendar";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { type DeepRequired } from "react-hook-form";

type MonthDatePickerProps = {
  onSelected?: (date: DeepRequired<DateRange>) => void;
  initialDate?: Date;
};

export const WeekDatePicker: FC<MonthDatePickerProps> = (props) => {
  const [date, setDate] = React.useState<Date>(props.initialDate ?? new Date());

  const calculateRange = (asOf: Date) => ({
    from: startOfWeek(asOf, { weekStartsOn: 1 }),
    to: endOfWeek(asOf, { weekStartsOn: 1 }),
  });

  React.useEffect(() => {
    if (props.onSelected) {
      props.onSelected(calculateRange(date));
    }
  }, []);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      if (props.onSelected) {
        props.onSelected(calculateRange(selectedDate));
      }
    }
  };

  const range = useMemo(() => calculateRange(date), [date]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-fit justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {format(range.from, "PPP") +
              " - " +
              format(range.to, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            numberOfMonths={1}
            weekStartsOn={1}
            showOutsideDays={true}
            fixedWeeks
            ISOWeek
            modifiers={{
              selected: (day) => day >= range.from && day <= range.to,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
