"use client";

import { SessionTemplateApi } from "@/api";
import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import {
  RecurringSessionForm,
  templateSessionPrecursor,
} from "@/components/visualizers/sessions/templates/form/RecurringSessionForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { addDays, differenceInMinutes, isBefore } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

type TemplateIntervalSelectProps = {
  interval: RecurringSessionInterval;
  onSelect: (interval: RecurringSessionInterval) => void;
};

const IntervalToLabel: Record<RecurringSessionInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
} as const;

export const TemplateIntervalSelect: FC<TemplateIntervalSelectProps> = (
  props,
) => {
  return (
    <Select
      onValueChange={(a: RecurringSessionInterval) => {
        props.onSelect(a);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue
          placeholder="Select an interval!"
          className="text-muted-foreground"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultChecked>
          {Object.entries(IntervalToLabel).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const TemplateForm: FC = () => {
  const form = useForm<z.infer<typeof templateSessionPrecursor>>({
    resolver: zodResolver(templateSessionPrecursor),
  });

  const mutation = useMutation({
    mutationKey: ["session-template"],
    mutationFn: async (data: z.infer<typeof templateSessionPrecursor>) => {
      const interval_start = data.start_date;

      const dailyHandler = (time: { hours: number; minutes: number }) => {
        let newDate = new Date(interval_start);
        newDate.setHours(time.hours, time.minutes, 0, 0);
        if (isBefore(newDate, interval_start)) {
          newDate = addDays(newDate, 1);
        }

        return differenceInMinutes(newDate, interval_start);
      };

      const weeklyHandler = (time: {
        day: number;
        hours: number;
        minutes: number;
      }) => {
        let newDate = new Date(interval_start);
        if (interval_start.getDay() < time.day) {
          newDate = addDays(interval_start, time.day - interval_start.getDay());
          newDate.setHours(time.hours, time.minutes, 0, 0);
        } else if (interval_start.getDay() > time.day) {
          newDate = addDays(newDate, 7);
          newDate = addDays(newDate, time.day - interval_start.getDay());
          newDate.setHours(time.hours, time.minutes, 0, 0);
        } else {
          newDate.setHours(time.hours, time.minutes, 0, 0);
          if (isBefore(newDate, interval_start)) {
            newDate = addDays(newDate, 7);
          }
        }

        console.log(newDate);
        return differenceInMinutes(newDate, interval_start);
      };

      const onFieldChange = (time: {
        day: number;
        hours: number;
        minutes: number;
      }) => {
        if (data.interval === "daily") {
          return dailyHandler(time);
        }
        return weeklyHandler(time);
      };

      const translatedData: SessionTemplateRequest["create"] = {
        name: data.name,
        interval: data.interval,
        start_date: data.start_date,
        end_date: data.end_date,
        sessions: data.sessions.map((session) => ({
          category_id: session.category!.id!,
          tag_ids: session.tags.map((tag) => tag.id),
          description: session.description ?? undefined,
          start_minute_offset: onFieldChange(session.start_date_time),
          end_minute_offset: onFieldChange(session.end_date_time),
        })),
      };

      await SessionTemplateApi.create(translatedData);
    },
  });

  const submitForm = async (data: z.infer<typeof templateSessionPrecursor>) => {
    await mutation.mutateAsync(data);
  };

  const fieldArray = useFieldArray({ control: form.control, name: "sessions" });
  console.log("interval", form.watch("interval"));
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm, console.error)}
        className="m-8 flex flex-col items-center justify-center gap-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inteval</FormLabel>
              <FormControl>
                <TemplateIntervalSelect
                  onSelect={(val) => {
                    field.onChange(val);
                  }}
                  interval={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <FormField
            name="start_date"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">Start Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    selected={field.value ?? undefined}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="end_date"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">End Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    selected={field.value ?? undefined}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {fieldArray.fields.map((field, index) => (
          <div className="flex items-center gap-2" key={field.id}>
            <div className="rounded-md border p-4">
              <Trash2
                className="cursor-pointer hover:text-red-500"
                type="button"
                onClick={() => fieldArray.remove(index)}
              />
            </div>
            <RecurringSessionForm
              interval={form.watch("interval")}
              intervalStart={form.watch("start_date")}
              control={form.control}
              parentFieldIndex={index}
            />
          </div>
        ))}
        <Plus
          className="cursor-pointer hover:text-green-400"
          type="button"
          onClick={() =>
            fieldArray.append({
              // @ts-expect-error - .append expects a full object, but we are providing a partial one because category and tags are not set yet
              category: undefined,
              tags: [],
              description: undefined,
            })
          }
        />
        <Button type="submit" className="w-full" variant="default" size="lg">
          Submit
        </Button>
      </form>
    </Form>
  );
};
