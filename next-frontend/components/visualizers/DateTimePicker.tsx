"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { addMinutes } from "date-fns";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import { FC, useEffect, useState } from "react";

import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { cn } from "@/lib/utils";
import { Matcher } from "react-day-picker";
import { Separator } from "@/components/shadcn/separator";

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
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (isHovered) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
    };
  }, [isHovered]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    if (props.selected) {
      const newDate = new Date(props.selected);
      if (type === "hour") {
        newDate.setHours(parseInt(value));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(value));
      }
      props.onSelect(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          variant="outline"
          className={cn(
            "w-full text-center font-normal gap-2",
            !props.selected && "text-muted-foreground",
          )}
          onWheel={(e) =>
            props.onSelect(
              addMinutes(props.selected ?? new Date(), e.deltaY > 0 ? -1 : 1),
            )
          }
        >
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
        <div className="sm:flex">
          <Calendar
            disabled={props.disabled}
            weekStartsOn={1}
            mode="single"
            selected={props.selected}
            onSelect={(v) => v && props.onSelect(v)}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2 items-center">
                <p className="text-muted-foreground">HH</p>
                <Separator />
                {hours.reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      props.selected && props.selected.getHours() === hour
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2 items-center">
                <p className="text-muted-foreground">MM</p>
                <Separator />
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      props.selected && props.selected.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
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
