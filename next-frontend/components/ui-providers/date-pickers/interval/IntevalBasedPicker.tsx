"use client";

import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { Card } from "@/components/shadcn/card";
import { DailyIntervalPicker } from "@/components/ui-providers/date-pickers/interval/DailyIntervalPicker";
import { WeeklyIntervalPicker } from "@/components/ui-providers/date-pickers/interval/WeeklyIntervalPicker";
import { FC } from "react";

type IntervalBasedDatePickerProps = {
  interval_start: Date;
  interval: RecurringSessionInterval;
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

export const IntervalBasedDatePicker: FC<IntervalBasedDatePickerProps> = (
  props,
) => {
  if (props.interval === "weekly") {
    return (
      <WeeklyIntervalPicker
        onSelect={props.onSelect}
        selected={props.selected}
        orientation={props.orientation}
      />
    );
  }

  if (props.interval === "daily") {
    return (
      <Card>
        <DailyIntervalPicker
          orientation={props.orientation}
          onSelect={props.onSelect}
          selected={props.selected}
        />
      </Card>
    );
  }

  return null;
};
