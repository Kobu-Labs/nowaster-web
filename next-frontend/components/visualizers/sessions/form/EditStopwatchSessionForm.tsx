"use client"

import {
  CategoryWithIdSchema,
  TagWithIdSchema,
  StopwatchSessionRequest,
  StopwatchSessionWithId,
} from "@/api/definitions";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import {
  DateTimePicker,
  QuickOption,
} from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  isBefore,
  isAfter,
  differenceInSeconds,
  addHours,
  addMinutes,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns";
import React from "react";
import { useForm, Form } from "react-hook-form";
import { z } from "zod";

const updateSessionPrecursor = z.object({
  id: z.string().uuid(),
  startTime: z.coerce.date().nullish(),
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullish(),
  tags: z.array(TagWithIdSchema).nullish(),
});

const dateQuickOptions: QuickOption[] = [
  {
    label: "now",
    increment: () => new Date(),
  },
  {
    label: "clamp",
    increment: (date) => setMinutes(date, 0),
  },
  {
    label: "+ 15m",
    increment: (date) => addMinutes(date, 15),
  },
  {
    label: "- 15m",
    increment: (date) => subMinutes(date, 15),
  },
  {
    label: "+ 1h",
    increment: (date) => addHours(date, 1),
  },
  {
    label: "- 1h",
    increment: (date) => subHours(date, 1),
  },
];


const formatTimeDifference = (seconds: number) => {
  const diffInSeconds = seconds;
  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds2 = diffInSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds2.toString().padStart(2, "0"),
  ].join(":");
};

export type EditSessionFormHandle = {
  validate: () => Promise<boolean>;
  prepareData: () => StopwatchSessionRequest["update"];
};

interface FormComponentProps {
  onSubmit?: (values: z.infer<typeof updateSessionPrecursor>) => void;
  session: StopwatchSessionWithId;
  hideBorder?: boolean;
}

export const EditStopwatchSession = React.forwardRef<
  EditSessionFormHandle,
  FormComponentProps
>(({ session, hideBorder }, ref) => {
  const form = useForm<z.infer<typeof updateSessionPrecursor>>({
    resolver: zodResolver(updateSessionPrecursor),
    defaultValues: {
      id: session.id,
      startTime: session.startTime,
      category: session.category,
      description: session.description,
      tags: session.tags ?? [],
    },
  });

  // Expose the validate method to the parent
  React.useImperativeHandle(ref, () => ({
    validate: async () => await form.trigger(),
    prepareData: () => {
      const values = form.getValues();
      const updateData: StopwatchSessionRequest["update"] = {
        id: values.id,
        startTime: values.startTime,
        category_id: values.category?.id,
        description: values.description,
        tag_ids: values.tags?.map((tag) => tag.id),
      };
      return updateData;
    },
  }));
  const updateSession = useUpdateSession("stopwatch");

  async function onSubmit(values: z.infer<typeof updateSessionPrecursor>) {
    if (values.startTime && isBefore(new Date(), values.startTime)) {
      form.setError("startTime", {
        message: "Start time must be in the past",
      });
      return;
    }

    const updateData: StopwatchSessionRequest["update"] = {
      id: values.id,
      startTime: values.startTime,
      category_id: values.category?.id,
      description: values.description,
      tag_ids: values.tags?.map((tag) => tag.id),
    };

    await updateSession.mutateAsync(updateData);
  }

  return (
    <Card className={cn(hideBorder && "border-0")}>
      <CardContent className="mt-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="category"
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

            <FormField
              control={form.control}
              name="description"
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

            <div className="flex items-center gap-4">
              <FormField
                name="startTime"
                control={form.control}
                render={({ field }) => {
                  const value = form.watch("startTime");

                  return (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="flex items-center gap-2">
                        {`Start Time`}
                        {value &&
                          isAfter(new Date(), value) &&
                          ` (${formatTimeDifference(differenceInSeconds(new Date(), value))} ago)`}
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          quickOptions={dateQuickOptions}
                          selected={value ?? undefined}
                          onSelect={(val) => {
                            if (val) {
                              if (val && isBefore(new Date(), val)) {
                                form.setError("startTime", {
                                  message:
                                    "Cannot set start time in the future",
                                });
                                return;
                              }
                            }

                            field.onChange(val);
                            form.clearErrors("startTime");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              name="tags"
              control={form.control}
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
                      forCategory={form.watch("category") ?? undefined}
                      disabled={form.getValues("category") === undefined}
                      onNewTagsSelected={(tags) => field.onChange(tags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});
EditStopwatchSession.displayName = "EditStopwatchSession";
