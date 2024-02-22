"use client";

import { Calendar } from "@/components/ui/calendar";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "recharts";
import { DateTime } from "luxon";
import { FC } from "react";
import { addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "@radix-ui/react-icons";

export type QuickOption = {
  label: string,
  increment: (date: Date) => Date
}

type DatePickerDemoProps = {
  selected: Date | undefined
  onSelect: (date: Date) => void
  quickOptions?: QuickOption[]
}

export const DateTimePicker: FC<DatePickerDemoProps> = (props) => {

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target;
    const datetime = DateTime.fromJSDate(props.selected || new Date());
    const hours = Number.parseInt(value.split(":")[0] || "00", 10);
    const minutes = Number.parseInt(value.split(":")[1] || "00", 10);
    const modifiedDay = datetime.set({ hour: hours, minute: minutes });
    props.onSelect(modifiedDay.toJSDate());
  };

  return (
    <Popover >
      <PopoverTrigger onWheel={(e) => props.onSelect(addMinutes(props.selected || new Date(), e.deltaY > 0 ? -1 : 1))} asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !props.selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {props.selected ? DateTime.fromJSDate(props.selected).toFormat("DDD HH:mm") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          weekStartsOn={1}
          mode="single"
          selected={props.selected}
          onSelect={(v) => v && props.onSelect(v)}
          initialFocus
        />
        <div className="px-4 pb-4 pt-0">
          <Label>Time</Label>
          <Input
            type="time"
            onChange={handleChange}
            value={props.selected ? DateTime.fromJSDate(props.selected).toFormat("HH:mm") : "Nothing"}
          />
        </div>
      </PopoverContent>
      <div className="flex gap-1">
        {props.quickOptions?.map(val => {
          return <Button
            className="block h-min p-1"
            key={val.label}
            variant={"secondary"}
            type="button"
            onClick={() => props.onSelect(val.increment(props.selected || new Date()))}>{val.label}
          </Button>;
        })}
      </div>
    </Popover>
  );
};
