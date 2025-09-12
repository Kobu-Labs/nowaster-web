"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { addMinutes } from "date-fns";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import type { FC } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import type { QuickOption } from "@/components/ui-providers/date-pickers/QuickOptions";
import { cn } from "@/lib/utils";
import type { Matcher } from "react-day-picker";

interface DatePickerDemoProps {
  disabled?: Matcher;
  label?: string;
  onSelect: (date: Date | undefined) => void;
  quickOptions?: QuickOption[];
  selected: Date | undefined;
}

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
        newDate.setHours(Number.parseInt(value));
      } else if (type === "minute") {
        newDate.setMinutes(Number.parseInt(value));
      }
      props.onSelect(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full text-center font-normal gap-2",
            !props.selected && "text-muted-foreground",
          )}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          onWheel={(e) => {
            props.onSelect(
              addMinutes(props.selected ?? new Date(), e.deltaY > 0 ? -1 : 1),
            );
          }}
          variant="outline"
        >
          <CalendarIcon className="size-4" />
          {props.selected
            ? (
                <>
                  <p>{DateTime.fromJSDate(props.selected).toFormat("DDD HH:mm")}</p>
                  <div className="grow"></div>
                  <X
                    className="cursor-pointer rounded-md hover:bg-destructive "
                    onClick={() => {
                      props.onSelect(undefined);
                    }}
                  />
                </>
              )
            : (
                <span>{props.label ?? "Pick a date"}</span>
              )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex bg-purple-muted w-full">
          <Calendar
            autoFocus
            className="w-full"
            disabled={props.disabled}
            mode="single"
            onSelect={(v) => v && props.onSelect(v)}
            selected={props.selected}
            weekStartsOn={1}
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col px-2 items-center">
                <p className="text-white">HH</p>
                <Separator className="sm:hidden" orientation="vertical" />
                <Separator
                  className="hidden sm:block"
                  orientation="horizontal"
                />
                {hours.map((hour) => (
                  <Button
                    className="sm:w-full shrink-0 aspect-square"
                    key={hour}
                    onClick={() => {
                      handleTimeChange("hour", hour.toString());
                    }}
                    size="icon"
                    variant={
                      props.selected && props.selected.getHours() === hour
                        ? "default"
                        : "ghost"
                    }
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar className="sm:hidden" orientation="horizontal" />
              <ScrollBar className="hidden sm:block" orientation="vertical" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col px-2 items-center">
                <p className="text-white">MM</p>
                <Separator className="sm:hidden" orientation="vertical" />
                <Separator
                  className="hidden sm:block"
                  orientation="horizontal"
                />
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    className="sm:w-full shrink-0 aspect-square"
                    key={minute}
                    onClick={() => {
                      handleTimeChange("minute", minute.toString());
                    }}
                    size="icon"
                    variant={
                      props.selected && props.selected.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar className="sm:hidden" orientation="horizontal" />
              <ScrollBar className="hidden sm:block" orientation="vertical" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
      <div className="flex gap-1">
        {props.quickOptions?.map((val) => (
          <Button
            className="block h-min p-1"
            key={val.label}
            onClick={() => {
              props.onSelect(val.increment(props.selected ?? new Date()));
            }}
            type="button"
            variant="secondary"
          >
            {val.label}
          </Button>
        ))}
      </div>
    </Popover>
  );
};
