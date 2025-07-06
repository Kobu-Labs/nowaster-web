"use client";

import { SessionTemplateApi } from "@/api";
import { CategoryWithIdSchema, TagWithIdSchema } from "@/api/definitions";
import {
    RecurringSessionInterval,
    RecurringSessionIntervalSchema,
} from "@/api/definitions/models/session-template";
import { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import {
    intervalToStartOf
} from "@/components/visualizers/sessions/templates/TemplateCard";
import { TemplateOverview } from "@/components/visualizers/sessions/templates/TemplateOverview";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    addDays,
    differenceInMinutes,
    endOfDay,
    endOfMonth,
    endOfWeek,
    isWithinInterval,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { FC, useMemo } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const NewSessionPage = () => {
  const q = useQuery({
    queryFn: async () => {
      return await SessionTemplateApi.readMany();
    },
    queryKey: ["session-templates"],
  });

  if (q.isPending) {
    return <div>Loading...</div>;
  }

  if (q.isError) {
    return <div>Error: {q.error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-4 grow mx-16 my-10">
      {q.data.map((template) => (
        <TemplateOverview template={template} key={template.id} />
      ))}
      <TemplateForm />
    </div>
  );
};

export default NewSessionPage;

const recurringSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  tags: z.array(TagWithIdSchema),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
});

const templateSessionPrecursor = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  sessions: z.array(recurringSessionPrecursor),
});

type SlideAnswersProps = {
  control: Control<z.infer<typeof templateSessionPrecursor>>;
  relativeTo: Date;
  interval: RecurringSessionInterval;
  parentFieldIndex: number;
};

const RecurringSessionForm: FC<SlideAnswersProps> = (props) => {
  const interval = useMemo(() => {
    switch (props.interval) {
      case "daily":
        return {
          start: startOfDay(props.relativeTo),
          end: endOfDay(props.relativeTo),
        };
      case "weekly":
        return {
          start: startOfWeek(props.relativeTo, { weekStartsOn: 1 }),
          end: endOfWeek(props.relativeTo, { weekStartsOn: 1 }),
        };
      case "bi-weekly":
        return {
          start: startOfWeek(props.relativeTo, { weekStartsOn: 1 }),
          end: endOfWeek(props.relativeTo, { weekStartsOn: 1 }),
        };
      case "monthly":
        return {
          start: startOfMonth(props.relativeTo),
          end: endOfMonth(props.relativeTo),
        };
    }
  }, [props.interval, props.relativeTo]);

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
            name={`sessions.${props.parentFieldIndex}.start_date`}
            control={props.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">Start Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    selected={field.value ?? undefined}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    disabled={(val) => {
                      return !isWithinInterval(val, interval);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name={`sessions.${props.parentFieldIndex}.end_date`}
            control={props.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="block">End Time</FormLabel>
                <FormControl>
                  <DateTimePicker
                    selected={field.value ?? undefined}
                    onSelect={(val) => {
                      field.onChange(val);
                    }}
                    disabled={(val) => {
                      return !isWithinInterval(val, interval);
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

const TemplateForm: FC = () => {
  const defaultInterval = "weekly";
  const defaultIntervalDates = useMemo(() => {
    const start = intervalToStartOf(defaultInterval, new Date());
    const end = addDays(start, 7);
    return {
      start_date: start,
      end_date: end,
    };
  }, []);
  const form = useForm<z.infer<typeof templateSessionPrecursor>>({
    resolver: zodResolver(templateSessionPrecursor),
    defaultValues: {
      ...defaultIntervalDates,
      interval: defaultInterval,
    },
  });

  const mutation = useMutation({
    mutationKey: ["session-template"],
    mutationFn: async (data: z.infer<typeof templateSessionPrecursor>) => {
      const translatedData: SessionTemplateRequest["create"] = {
        name: data.name,
        interval: data.interval,
        start_date: data.start_date,
        end_date: data.end_date,
        sessions: data.sessions.map((session) => ({
          category_id: session.category.id,
          tag_ids: session.tags.map((tag) => tag.id),
          description: session.description ?? undefined,
          start_minute_offset: differenceInMinutes(
            data.start_date,
            session.start_date,
          ),
          end_minute_offset: differenceInMinutes(
            data.start_date,
            session.end_date,
          ),
        })),
      };

      await SessionTemplateApi.create(translatedData);
    },
  });

  const submitForm = async (data: z.infer<typeof templateSessionPrecursor>) => {
    await mutation.mutateAsync(data);
  };

  const fieldArray = useFieldArray({ control: form.control, name: "sessions" });
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
            <div className="rounded-m border p-4">
              <Trash2
                className="cursor-pointer hover:text-red-500"
                type="button"
                onClick={() => fieldArray.remove(index)}
              />
            </div>
            <Card>
              <CardHeader></CardHeader>
              <CardContent>
                <RecurringSessionForm
                  interval={form.watch("interval")}
                  relativeTo={form.watch("start_date")}
                  control={form.control}
                  parentFieldIndex={index}
                />
              </CardContent>
            </Card>
          </div>
        ))}
        <Plus
          className="cursor-pointer hover:text-green-400"
          type="button"
          onClick={() => fieldArray.append({})}
        />
        <Button type="submit" className="w-full" variant="default" size="lg">
          Submit
        </Button>
      </form>
    </Form>
  );
};
