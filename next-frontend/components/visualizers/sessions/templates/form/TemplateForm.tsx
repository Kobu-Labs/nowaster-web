"use client";

import { SessionTemplateApi } from "@/api";
import type { SessionTemplate } from "@/api/definitions/models/session-template";
import type { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Separator } from "@/components/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import type { TemplateSessionPrecursor } from "@/components/visualizers/sessions/templates/form/form-schemas";
import { templateSessionPrecursorSchema } from "@/components/visualizers/sessions/templates/form/form-schemas";
import { RecurringSessionForm } from "@/components/visualizers/sessions/templates/form/RecurringSessionForm";
import { TemplateIntervalSelect } from "@/components/visualizers/sessions/templates/TemplateIntervalSelect";
import { getDaytimeAfterDate } from "@/lib/date-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMinutes, differenceInMinutes, isAfter, set } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const translateTemplateToPrecursor = (
  template: SessionTemplate,
): TemplateSessionPrecursor => {
  return {
    ...template,
    sessions: template.sessions.map((sess) => {
      const start = addMinutes(template.start_date, sess.start_minute_offset);
      const end = addMinutes(template.start_date, sess.end_minute_offset);
      return {
        ...sess,
        description: sess.description ?? undefined,
        end_date_time: {
          day: end.getDay(),
          hours: end.getHours(),
          minutes: end.getMinutes(),
        },
        start_date_time: {
          day: start.getDay(),
          hours: start.getHours(),
          minutes: start.getMinutes(),
        },
      };
    }),
  };
};

type TemplateFormProps = {
  defaultValues?: SessionTemplate;
  isLoading?: boolean;
  onError?: () => void;
  onSubmit: (data: TemplateSessionPrecursor) => void;
};

export const TemplateForm: FC<TemplateFormProps> = (props) => {
  const form = useForm<TemplateSessionPrecursor>({
    defaultValues: props.defaultValues
      ? translateTemplateToPrecursor(props.defaultValues)
      : undefined,
    resolver: zodResolver(templateSessionPrecursorSchema),
  });

  const fieldArray = useFieldArray({ control: form.control, name: "sessions" });

  const preventContinue
    = form.watch("interval") === undefined
      || form.watch("start_date") === undefined
      || form.watch("end_date") === undefined;

  return (
    <Form {...form}>
      <form
        className="mx-2 my-6 md:mx-8 md:my-4 flex flex-col items-center justify-center gap-6 md:gap-4"
        onSubmit={form.handleSubmit(props.onSubmit, props.onError)}
      >
        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 content-center">
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
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">Start Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    disabled={(val) =>
                      isAfter(
                        set(new Date(), {
                          hours: 0,
                          milliseconds: 0,
                          minutes: 0,
                          seconds: 0,
                        }),
                        val,
                      )}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    selected={field.value ?? undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">End Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    selected={field.value ?? undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="w-full" />

        <div className="flex flex-col gap-4 mt-6 md:mt-4 items-center w-full">
          {fieldArray.fields.map((field, index) => (
            <div
              className="flex flex-col md:flex-row items-center gap-2 col-span-full w-full"
              key={field.id}
            >
              <Button
                className="rounded-md border p-4 group self-start md:self-center"
                onClick={() => {
                  fieldArray.remove(index);
                }}
                variant="outline"
              >
                <Trash2 className="group-hover:text-red-500" />
              </Button>
              <div className="w-full">
                <RecurringSessionForm
                  control={form.control}
                  interval={form.watch("interval")}
                  intervalStart={form.watch("start_date")}
                  parentFieldIndex={index}
                />
              </div>
            </div>
          ))}
          <TooltipProvider delayDuration={preventContinue ? 0 : 50_000}>
            <Tooltip>
              <TooltipTrigger className="cursor-not-allowed">
                <Button
                  className="group flex items-center gap-2 "
                  disabled={preventContinue}
                  onClick={() => {
                    fieldArray.append({
                      // @ts-expect-error - .append expects a full object, but we are providing a partial one because category and tags are not set yet
                      category: undefined,
                      description: undefined,
                      tags: [],
                    });
                  }}
                  type="button"
                  variant="outline"
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
          <Button className="w-fit" size="lg" type="submit" variant="default">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const CreateTemplateFormDialog: FC<{
  defaultValues?: SessionTemplate;
  open: boolean;
  setIsOpen: (val: boolean) => void;
}> = (props) => {
  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: async (precursor: TemplateSessionPrecursor) => {
      const translatedData = translateTemplatePrecursor(precursor);
      return await SessionTemplateApi.create(translatedData);
    },
    mutationKey: ["session-template"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
    },
  });

  const submitForm = async (data: TemplateSessionPrecursor) => {
    await createTemplateMutation.mutateAsync(data);
    props.setIsOpen(false);
  };

  return (
    <Dialog modal={false} onOpenChange={props.setIsOpen} open={props.open}>
      <DialogContent className="px-0 md:p-6 pb-0 w-[90vw] max-w-[90vw] max-h-[90vh] md:w-fit md:max-w-4xl md:max-h-[90vh] gradient-card-solid rounded-lg flex flex-col">
        <DialogHeader className="px-2 md:px-6 pb-2 md:pb-4 flex-shrink-0">
          <DialogTitle className="m-1">Create New Template</DialogTitle>
          <DialogDescription>
            Create a template with recurring sessions that will repeat based on
            your schedule.
          </DialogDescription>
        </DialogHeader>
        <Separator className="w-full flex-shrink-0" />
        <div className="overflow-y-auto flex-1 px-0 pb-0 md:px-6 md:pb-6">
          <TemplateForm
            defaultValues={props.defaultValues}
            isLoading={createTemplateMutation.isPending}
            onSubmit={submitForm}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const translateTemplatePrecursor = (precursor: TemplateSessionPrecursor) => {
  const translatedData: SessionTemplateRequest["create"] = {
    end_date: precursor.end_date,
    interval: precursor.interval,
    name: precursor.name,
    sessions: precursor.sessions.map((session) => {
      const session_start = getDaytimeAfterDate(
        precursor.start_date,
        precursor.interval,
        session.start_date_time,
      );
      const session_end = getDaytimeAfterDate(
        session_start,
        precursor.interval,
        session.end_date_time,
      );

      return {
        category_id: session.category.id,
        description: session.description ?? undefined,
        end_minute_offset: differenceInMinutes(
          session_end,
          precursor.start_date,
        ),
        start_minute_offset: differenceInMinutes(
          session_start,
          precursor.start_date,
        ),
        tag_ids: session.tags.map((tag) => tag.id),
      };
    }),
    start_date: precursor.start_date,
  };

  return translatedData;
};
