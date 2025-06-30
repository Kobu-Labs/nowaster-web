"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { SessionTemplateApi } from "@/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
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
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import {
  RecurringSessionForm,
  templateSessionPrecursor,
} from "@/components/visualizers/sessions/templates/form/RecurringSessionForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, differenceInMinutes, isBefore } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { FC, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Separator } from "@/components/shadcn/separator";
import { TemplateIntervalSelect } from "@/components/visualizers/sessions/templates/TemplateIntervalSelect";


type TemplateFormProps = {
  onSuccess?: () => void;
};

export const TemplateForm: FC<TemplateFormProps> = (props) => {
  const form = useForm<z.infer<typeof templateSessionPrecursor>>({
    resolver: zodResolver(templateSessionPrecursor),
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["session-template"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
      if (props.onSuccess) {
        props.onSuccess();
      }
    },
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
        sessions: data.sessions.map((session) => {
          const session_start = onFieldChange(session.start_date_time);
          let session_end = onFieldChange(session.end_date_time);

          if (session_start >= session_end) {
            if (data.interval === "daily") {
              session_end = session_start + 24 * 60; // add 24 hours in minutes
            } else {
              session_end += 7 * 24 * 60;
            }
          }

          return {
            category_id: session.category!.id!,
            tag_ids: session.tags.map((tag) => tag.id),
            description: session.description ?? undefined,
            start_minute_offset: session_start,
            end_minute_offset: session_end,
          };
        }),
      };

      return await SessionTemplateApi.create(translatedData);
    },
  });

  const submitForm = async (data: z.infer<typeof templateSessionPrecursor>) => {
    await mutation.mutateAsync(data);
  };

  const fieldArray = useFieldArray({ control: form.control, name: "sessions" });

  const preventContinue =
    mutation.isPending ||
    form.watch("interval") === undefined ||
    form.watch("start_date") === undefined ||
    form.watch("end_date") === undefined;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm, console.error)}
        className="m-8 flex flex-col items-center justify-center gap-8"
      >
        <div className="grid w-full grid-cols-2 gap-4 content-center">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter template name" />
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
                    {...field}
                    key={field.value}
                    onValueChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

        <Separator className="w-full" />

        <div className="flex flex-col gap-4 mt-8 items-center">
          {fieldArray.fields.map((field, index) => (
            <div
              className="flex items-center gap-2 col-span-full"
              key={field.id}
            >
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
          <TooltipProvider delayDuration={preventContinue ? 0 : 50000}>
            <Tooltip>
              <TooltipTrigger className="cursor-not-allowed">
                <Button
                  type="button"
                  variant="outline"
                  className="group flex items-center gap-2 "
                  disabled={preventContinue}
                  onClick={() =>
                    fieldArray.append({
                      // @ts-expect-error - .append expects a full object, but we are providing a partial one because category and tags are not set yet
                      category: undefined,
                      tags: [],
                      description: undefined,
                    })
                  }
                >
                  Add Session
                  <Plus
                    className="cursor-pointer group-hover:text-green-400"
                    type="button"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-nowrap">
                Fill out form details first!
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-center w-full gap-4">
          <div className="grow" />
          <Button
            type="submit"
            className="w-fit"
            variant="default"
            size="lg"
            loading={mutation.isPending}
          >
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const TemplateFormDialog: FC = () => {
  const [open, setIsOpen] = useState(false);

  return (
    <div>
      <Button
        className="w-fit flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Plus />
        Create template
      </Button>
      <Dialog modal={false} onOpenChange={setIsOpen} open={open}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a template with recurring sessions that will repeat based
              on your schedule.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const EditTemplateFormDialog: FC<{
  template: SessionTemplate;
    open:boolean,
    setIsOpen: (val:boolean) => void
}> = (props) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["session-template"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
    },
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

      const translatedData: SessionTemplateRequest["update"] = {
        id: props.template.id,
        name: data.name,
        interval: data.interval,
        start_date: data.start_date,
        end_date: data.end_date,
        sessions: data.sessions.map((session) => {
          const session_start = onFieldChange(session.start_date_time);
          let session_end = onFieldChange(session.end_date_time);

          if (session_start >= session_end) {
            if (data.interval === "daily") {
              session_end = session_start + 24 * 60; // add 24 hours in minutes
            } else {
              session_end += 7 * 24 * 60;
            }
          }

          return {
            category_id: session.category!.id!,
            tag_ids: session.tags.map((tag) => tag.id),
            description: session.description ?? undefined,
            start_minute_offset: session_start,
            end_minute_offset: session_end,
          };
        }),
      };

      return await SessionTemplateApi.update(translatedData);
    },
  });

  const submitForm = async (data: z.infer<typeof templateSessionPrecursor>) => {
    await mutation.mutateAsync(data);
    props.setIsOpen(false);
  };

  return (
    <Dialog modal={false} onOpenChange={props.setIsOpen} open={props.open}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Edit a template with recurring sessions that will repeat based on
            your schedule.
          </DialogDescription>
        </DialogHeader>
        <TemplateForm defaultValues={props.template} onSubmit={submitForm} />
      </DialogContent>
    </Dialog>
  );
};
