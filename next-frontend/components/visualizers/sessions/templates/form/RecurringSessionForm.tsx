"use client";

import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import {
  RecurringSessionInterval,
  RecurringSessionIntervalSchema,
} from "@/api/definitions/models/session-template";
import { Card } from "@/components/shadcn/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { IntervalBasedPicker } from "@/components/ui-providers/date-pickers/interval/IntevalBasedPicker";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { FC } from "react";
import { Control } from "react-hook-form";
import { z } from "zod";

export const recurringSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  tags: z.array(TagWithIdSchema),
  description: z.string().optional(),
  start_date_time: z.object({
    hours: z.number().min(0).max(23),
    minutes: z.number().min(0).max(59),
    day: z.number().min(0).max(6),
  }),
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

export type RecurringSessionFormProps = {
  control: Control<z.infer<typeof templateSessionPrecursor>>;
  intervalStart: Date;
  interval: RecurringSessionInterval;
  parentFieldIndex: number;
};

export const RecurringSessionForm: FC<RecurringSessionFormProps> = (props) => {
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
                  <IntervalBasedPicker
                    selected={field.value}
                    orientation="horizontal"
                    interval={props.interval}
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
            name={`sessions.${props.parentFieldIndex}.end_date_time`}
            control={props.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">End</FormLabel>
                <FormControl>
                  <IntervalBasedPicker
                    selected={field.value}
                    orientation="horizontal"
                    interval={props.interval}
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
