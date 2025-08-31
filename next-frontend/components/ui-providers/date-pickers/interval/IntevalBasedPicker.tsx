"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/shadcn/popover";
import type { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { Card } from "@/components/shadcn/card";
import type {
  DailyIntervalPickerProps} from "@/components/ui-providers/date-pickers/interval/DailyIntervalPicker";
import {
  DailyIntervalPicker
} from "@/components/ui-providers/date-pickers/interval/DailyIntervalPicker";
import {
  WeeklyIntervalPicker,
} from "@/components/ui-providers/date-pickers/interval/WeeklyIntervalPicker";
import type { FC } from "react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { formatIntervalPickerLabel } from "@/lib/date-utils";

interface IntervalBasedPickerProps {
  interval: RecurringSessionInterval;
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  orientation?: "horizontal" | "vertical";
  selected?: { day: number; hours: number; minutes: number };
}

const intervalToPicker = {
  daily: (props: DailyIntervalPickerProps) => (
    <Card className="p-2">
      <DailyIntervalPicker {...props} />
    </Card>
  ),
  weekly: WeeklyIntervalPicker 
} satisfies Record<RecurringSessionInterval, FC<any>>;

export const IntervalBasedPicker: FC<IntervalBasedPickerProps> = (props) => {
  const Component = intervalToPicker[props.interval];
  return (
    <Popover modal={false}>
      <PopoverTrigger className="p-1">
        <Button
          className={cn("w-[240px] justify-start text-left font-normal")}
          type="button"
          variant={"outline"}
        >
          <CalendarIcon className="mr-2 size-4" />
          <span>
            {formatIntervalPickerLabel(props.interval, props.selected)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 m-0 border-none w-[400px]">
        <Component {...props} />
      </PopoverContent>
    </Popover>
  );
};
