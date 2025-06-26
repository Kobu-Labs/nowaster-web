import { FC } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { DailyIntervalPicker } from "@/components/ui-providers/date-pickers/interval/DailyIntervalPicker";
import { daysOfWeek } from "@/lib/date-utils";

type WeeklyIntervalDatePickerProps = {
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

export const WeeklyIntervalPicker: FC<WeeklyIntervalDatePickerProps> = (
  props,
) => {
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Select a Day</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 w-full">
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <Button
              type="button"
              key={day.value}
              size="sm"
              className="h-12 text-xs font-medium"
              variant={props.selected?.day === day.value ? "default" : "ghost"}
              onClick={() =>
                props.onSelect({
                  day: day.value,
                  hours: props.selected?.hours ?? 0,
                  minutes: props.selected?.minutes ?? 0,
                })
              }
            >
              <span className="hidden sm:inline">{day.short}</span>
              <span className="sm:hidden">{day.short.charAt(0)}</span>
            </Button>
          ))}
        </div>
        <Separator className="my-4" />
        <DailyIntervalPicker
          orientation={props.orientation}
          selected={props.selected}
          onSelect={(val) =>
            props.onSelect({
              day: props.selected?.day ?? 0,
              hours: val.hours,
              minutes: val.minutes,
            })
          }
        />
      </CardContent>
    </Card>
  );
};
