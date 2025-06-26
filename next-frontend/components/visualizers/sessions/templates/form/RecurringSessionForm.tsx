"use client";

import { FC } from "react";
import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import {
  RecurringSessionInterval,
  RecurringSessionIntervalSchema,
} from "@/api/definitions/models/session-template";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { cn, numberToDay, zeroPad } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/shadcn/popover";
import { CalendarIcon } from "lucide-react";
import { Control } from "react-hook-form";
import { z } from "zod";

export const recurringSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  tags: z.array(TagWithIdSchema),
  description: z.string().optional(),
  // offset from stat_date of the template in seconds
  start_date_time: z.object({
    hours: z.number().min(0).max(23),
    minutes: z.number().min(0).max(59),
    day: z.number().min(0).max(6),
  }),
  // offset from stat_date of the template in seconds
  end_date_time: z.object({
    hours: z.number().min(0).max(23),
    minutes: z.number().min(0).max(59),
    day: z.number().min(0).max(6),
  }),
});

export const templateSessionPrecursor = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  sessions: z.array(recurringSessionPrecursor),
});

export type SlideAnswersProps = {
  control: Control<z.infer<typeof templateSessionPrecursor>>;
  intervalStart: Date;
  interval: RecurringSessionInterval;
  parentFieldIndex: number;
};

type IntervalBasedDatePickerProps = {
  interval_start: Date;
  interval: RecurringSessionInterval;
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

const daysOfWeek = [
  { short: "Mon", full: "Monday", value: 1 },
  { short: "Tue", full: "Tuesday", value: 2 },
  { short: "Wed", full: "Wednesday", value: 3 },
  { short: "Thu", full: "Thursday", value: 4 },
  { short: "Fri", full: "Friday", value: 5 },
  { short: "Sat", full: "Saturday", value: 6 },
  { short: "Sun", full: "Sunday", value: 0 },
];

type WeeklyIntervalDatePickerProps = {
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

export const WeeklyIntervalDatePicker: FC<WeeklyIntervalDatePickerProps> = (
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
        <TimePicker
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

const toggleOrientation = (orientation: "horizontal" | "vertical") => {
  return orientation === "horizontal" ? "vertical" : "horizontal";
};

type DatePickerDemoProps = {
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

export const TimePicker: FC<DatePickerDemoProps> = (props) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const orientation = props.orientation ?? "vertical";

  return (
    <div
      className={cn(
        "flex w-full",
        orientation === "horizontal" && "flex-col ",
        orientation === "vertical" && "flex-row ",
      )}
    >
      <ScrollArea>
        <div
          className={cn(
            "flex p-2 gap-1",
            orientation === "horizontal" && "flex-row items-center w-[300px]",
            orientation === "vertical" && "flex-col h-[300px] items-center",
          )}
        >
          <div className="relative">
            <p className="top-0 text-muted-foreground sticky">HH</p>
          </div>
          <Separator orientation={toggleOrientation(orientation)} />
          {hours.map((hour) => (
            <Button
              key={hour}
              size="icon"
              type="button"
              className="shrink-0 aspect-square"
              variant={props.selected?.hours === hour ? "default" : "ghost"}
              onClick={() =>
                props.onSelect({
                  hours: hour,
                  minutes: props.selected?.minutes ?? 0,
                  day: props.selected?.day ?? 0,
                })
              }
            >
              {zeroPad(hour)}
            </Button>
          ))}
        </div>
        <ScrollBar orientation={orientation} />
      </ScrollArea>
      <ScrollArea>
        <div
          className={cn(
            "flex p-2 gap-1",
            orientation === "horizontal" && "flex-row items-center w-[300px]",
            orientation === "vertical" && "flex-col items-center h-[300px]",
          )}
        >
          <p className="text-muted-foreground">MM</p>
          <Separator orientation={toggleOrientation(orientation)} />
          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
            <Button
              key={minute}
              size="icon"
              type="button"
              className="shrink-0 aspect-square"
              variant={props.selected?.minutes === minute ? "default" : "ghost"}
              onClick={() =>
                props.onSelect({
                  minutes: minute,
                  hours: props.selected?.hours ?? 0,
                  day: props.selected?.day ?? 0,
                })
              }
            >
              {minute.toString().padStart(2, "0")}
            </Button>
          ))}
        </div>
        <ScrollBar orientation={orientation} />
      </ScrollArea>
    </div>
  );
};

export const IntervalBasedDatePicker: FC<IntervalBasedDatePickerProps> = (
  props,
) => {
  if (props.interval === "weekly") {
    return (
      <WeeklyIntervalDatePicker
        onSelect={props.onSelect}
        selected={props.selected}
        orientation={props.orientation}
      />
    );
  }

  if (props.interval === "daily") {
    return (
      <TimePicker
        orientation={props.orientation}
        onSelect={props.onSelect}
        selected={props.selected}
      />
    );
  }

  return null;
};

export const RecurringSessionForm: FC<SlideAnswersProps> = (props) => {
  return (
    <Card className="p-4">
      <fieldset className="flex flex-col gap-2">
        <FormField
          control={props.control}
          name={`sessions.${props.parentFieldIndex}.category`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Category</FormLabel>
              <FormControl>
                <SingleCategoryPicker
                  value={field.value ?? undefined}
                  onSelectedCategoriesChanged={(category) =>
                    field.onChange(category)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <FormField
            name={`sessions.${props.parentFieldIndex}.start_date_time`}
            control={props.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">Start</FormLabel>
                <FormControl>
                  <Popover modal={false}>
                    <PopoverTrigger className="p-1">
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        <span>
                          {field.value === undefined
                            ? "Pick a value"
                            : `${numberToDay(field.value.day).substring(0, 3)}, ${zeroPad(field.value.hours)}:${zeroPad(field.value.minutes)}`}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 m-0 border-none w-[400px]">
                      <IntervalBasedDatePicker
                        selected={field.value}
                        orientation="horizontal"
                        interval={props.interval}
                        interval_start={props.intervalStart}
                        onSelect={(val) => {
                          field.onChange(val);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name={`sessions.${props.parentFieldIndex}.end_date_time`}
            control={props.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">End</FormLabel>
                <FormControl>
                  <Popover modal={false}>
                    <PopoverTrigger className="p-1">
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        <span>
                          {field.value === undefined
                            ? "Pick a value"
                            : `${numberToDay(field.value.day).substring(0, 3)}, ${zeroPad(field.value.hours)}:${zeroPad(field.value.minutes)}`}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 m-0 border-none w-[400px]">
                      <IntervalBasedDatePicker
                        selected={field.value}
                        orientation="horizontal"
                        interval={props.interval}
                        interval_start={props.intervalStart}
                        onSelect={(val) => {
                          field.onChange(val);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={props.control}
          name={`sessions.${props.parentFieldIndex}.description`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Insert your description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name={`sessions.${props.parentFieldIndex}.tags`}
          control={props.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="block">Tags</FormLabel>
              <FormControl>
                <SimpleTagPicker
                  selectedTags={
                    field.value?.map((t) => ({
                      ...t,
                      usages: 0,
                      allowedCategories: [],
                    })) ?? []
                  }
                  onNewTagsSelected={(tags) => field.onChange(tags)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </fieldset>
    </Card>
  );
};
