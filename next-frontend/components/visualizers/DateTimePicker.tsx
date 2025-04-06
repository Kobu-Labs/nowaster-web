"use client";

import React, { FC } from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addMinutes } from "date-fns";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import { Label } from "recharts";

import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Matcher } from "react-day-picker";

export type QuickOption = {
  label: string;
  increment: (date: Date) => Date;
};

type DatePickerDemoProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  quickOptions?: QuickOption[];
  label?: string;
  disabled?: Matcher;
};

export const DateTimePicker: FC<DatePickerDemoProps> = (props) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target;
    const datetime = DateTime.fromJSDate(props.selected ?? new Date());
    const hours = Number.parseInt(value.split(":")[0] ?? "00", 10);
    const minutes = Number.parseInt(value.split(":")[1] ?? "00", 10);
    const modifiedDay = datetime.set({ hour: hours, minute: minutes });
    props.onSelect(modifiedDay.toJSDate());
  };

  return (
    <Popover>
      <PopoverTrigger
        onWheel={(e) =>
          props.onSelect(
            addMinutes(props.selected ?? new Date(), e.deltaY > 0 ? -1 : 1),
          )
        }
        asChild
      >
        <Button variant="outline" className="w-full gap-2">
          <CalendarIcon className="size-4" />
          {props.selected ? (
            <>
              <p>{DateTime.fromJSDate(props.selected).toFormat("DDD HH:mm")}</p>
              <div className="grow"></div>
              <X
                onClick={() => props.onSelect(undefined)}
                className="cursor-pointer rounded-md hover:bg-destructive "
              />
            </>
          ) : (
            <span>{props.label ?? "Pick a date"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          disabled={props.disabled}
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
            value={
              props.selected
                ? DateTime.fromJSDate(props.selected).toFormat("HH:mm")
                : "Nothing"
            }
          />
        </div>
      </PopoverContent>
      <div className="flex gap-1">
        {props.quickOptions?.map((val) => (
          <Button
            className="block h-min p-1"
            key={val.label}
            variant={"secondary"}
            type="button"
            onClick={() =>
              props.onSelect(val.increment(props.selected ?? new Date()))
            }
          >
            {val.label}
          </Button>
        ))}
      </div>
    </Popover>
  );
};
