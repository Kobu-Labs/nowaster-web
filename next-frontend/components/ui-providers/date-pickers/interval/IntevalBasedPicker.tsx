"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/shadcn/popover";
import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { Card } from "@/components/shadcn/card";
import {
  DailyIntervalPicker,
  DailyIntervalPickerProps,
} from "@/components/ui-providers/date-pickers/interval/DailyIntervalPicker";
import {
  WeeklyIntervalPicker,
  WeeklyIntervalPickerProps,
} from "@/components/ui-providers/date-pickers/interval/WeeklyIntervalPicker";
import { FC } from "react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { formatIntervalPickerLabel } from "@/lib/date-utils";

type IntervalBasedPickerProps = {
  interval: RecurringSessionInterval;
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

const intervalToPicker = {
  daily: (props: DailyIntervalPickerProps) => (
    <Card className="p-2">
      <DailyIntervalPicker {...props} />
    </Card>
  ),
  weekly: (props: WeeklyIntervalPickerProps) => (
    <WeeklyIntervalPicker {...props} />
  ),
} satisfies { [Key in RecurringSessionInterval]: FC<any> };

export const IntervalBasedPicker: FC<IntervalBasedPickerProps> = (props) => {
  const Component = intervalToPicker[props.interval];
  return (
    <Popover modal={false}>
      <PopoverTrigger className="p-1">
        <Button
          type="button"
          variant={"outline"}
          className={cn("w-[240px] justify-start text-left font-normal")}
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
