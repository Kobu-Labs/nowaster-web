"use client";

import { SessionTemplateApi } from "@/api";
import { SessionTemplate } from "@/api/definitions/models/session-template";
import { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
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
import {
  TemplateSessionPrecursor,
  templateSessionPrecursorSchema,
} from "@/components/visualizers/sessions/templates/form/form-schemas";
import { RecurringSessionForm } from "@/components/visualizers/sessions/templates/form/RecurringSessionForm";
import { TemplateIntervalSelect } from "@/components/visualizers/sessions/templates/TemplateIntervalSelect";
import { getDaytimeAfterDate } from "@/lib/date-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMinutes, differenceInMinutes, isAfter, set } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { FC } from "react";
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
  onSubmit: (data: TemplateSessionPrecursor) => void;
  onError?: () => void;
  isLoading?: boolean;
  defaultValues?: SessionTemplate;
};

export const TemplateForm: FC<TemplateFormProps> = (props) => {
  const form = useForm<TemplateSessionPrecursor>({
    resolver: zodResolver(templateSessionPrecursorSchema),
    defaultValues: props.defaultValues
      ? translateTemplateToPrecursor(props.defaultValues)
      : undefined,
  });

  const fieldArray = useFieldArray({ control: form.control, name: "sessions" });

  const preventContinue =
    form.watch("interval") === undefined ||
    form.watch("start_date") === undefined ||
    form.watch("end_date") === undefined;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(props.onSubmit, props.onError)}
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
                    disabled={(val) =>
                      isAfter(
                        set(new Date(), {
                          hours: 0,
                          minutes: 0,
                          seconds: 0,
                          milliseconds: 0,
                        }),
                        val,
                      )
                    }
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
              <Button
                className="rounded-md border p-4 group"
                variant="outline"
                onClick={() => fieldArray.remove(index)}
              >
                <Trash2 className="group-hover:text-red-500" />
              </Button>
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
          <Button type="submit" className="w-fit" variant="default" size="lg">
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
    mutationKey: ["session-template"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
    },
    mutationFn: async (precursor: TemplateSessionPrecursor) => {
      const translatedData = translateTemplatePrecursor(precursor);
      return await SessionTemplateApi.create(translatedData);
    },
  });

  const submitForm = async (data: TemplateSessionPrecursor) => {
    await createTemplateMutation.mutateAsync(data);
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
            Create a template with recurring sessions that will repeat based on
            your schedule.
          </DialogDescription>
        </DialogHeader>
        <TemplateForm
          isLoading={createTemplateMutation.isPending}
          onSubmit={submitForm}
          defaultValues={props.defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
};

const translateTemplatePrecursor = (precursor: TemplateSessionPrecursor) => {
  const translatedData: SessionTemplateRequest["create"] = {
    name: precursor.name,
    interval: precursor.interval,
    start_date: precursor.start_date,
    end_date: precursor.end_date,
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
        tag_ids: session.tags.map((tag) => tag.id),
        description: session.description ?? undefined,
        start_minute_offset: differenceInMinutes(
          session_start,
          precursor.start_date,
        ),
        end_minute_offset: differenceInMinutes(
          session_end,
          precursor.start_date,
        ),
      };
    }),
  };

  return translatedData;
};
