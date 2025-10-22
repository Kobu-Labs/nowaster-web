"use client";

import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import type { RecurringSessionInterval } from "@/api/definitions/models/session-template";
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
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import type { TemplateSessionPrecursor } from "@/components/visualizers/sessions/templates/form/form-schemas";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import type { FC } from "react";
import type { Control } from "react-hook-form";
import { z } from "zod";

export const recurringSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  description: z.string().optional(),
  end_date_time: z.object({
    day: z.number().min(0).max(6),
    hours: z.number().min(0).max(23),
    minutes: z.number().min(0).max(59),
  }),
  start_date_time: z.object({
    day: z.number().min(0).max(6),
    hours: z.number().min(0).max(23),
    minutes: z.number().min(0).max(59),
  }),
  tags: z.array(TagWithIdSchema),
});

export type RecurringSessionFormProps = {
  control: Control<TemplateSessionPrecursor>;
  interval: RecurringSessionInterval;
  intervalStart: Date;
  parentFieldIndex: number;
};

export const RecurringSessionForm: FC<RecurringSessionFormProps> = (props) => {
  return (
    <Card className="p-2 md:p-4">
      <fieldset className="flex flex-col gap-4 md:gap-2">
        <FormField
          control={props.control}
          name={`sessions.${props.parentFieldIndex}.category`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategoryPicker
                  mode="single"
                  onSelectCategory={field.onChange}
                  selectedCategory={field.value ?? null}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          <FormField
            control={props.control}
            name={`sessions.${props.parentFieldIndex}.start_date_time`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 flex-1">
                <FormLabel className="block">Start</FormLabel>
                <FormControl>
                  <IntervalBasedPicker
                    interval={props.interval}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    orientation="horizontal"
                    selected={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={props.control}
            name={`sessions.${props.parentFieldIndex}.end_date_time`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 flex-1">
                <FormLabel className="block">End</FormLabel>
                <FormControl>
                  <IntervalBasedPicker
                    interval={props.interval}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    orientation="horizontal"
                    selected={field.value}
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
                  onChange={field.onChange}
                  placeholder="Insert your description"
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={props.control}
          name={`sessions.${props.parentFieldIndex}.tags`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="block">Tags</FormLabel>
              <FormControl>
                <SimpleTagPicker
                  onNewTagsSelected={(tags) => { field.onChange(tags); }}
                  selectedTags={
                    field.value?.map((t) => ({
                      ...t,
                      allowedCategories: [],
                      last_used_at: new Date(),
                      usages: 0,
                    })) ?? []
                  }
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
