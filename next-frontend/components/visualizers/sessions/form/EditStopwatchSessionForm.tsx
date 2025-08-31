"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { StopwatchApi } from "@/api";
import type {
  StopwatchSessionRequest,
  StopwatchSessionWithId } from "@/api/definitions";
import {
  CategoryWithIdSchema,
  ScheduledSessionRequestSchema,
  TagWithIdSchema,
} from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useCreateScheduledSession } from "@/components/hooks/session/fixed/useCreateSession";
import { useDeleteStopwatchSession } from "@/components/hooks/session/stopwatch/useDeleteStopwatchSession";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { dateQuickOptions } from "@/components/ui-providers/date-pickers/QuickOptions";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInSeconds, isAfter, isBefore } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const updateSessionPrecursor = z.object({
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullish(),
  id: z.uuid(),
  startTime: z.coerce.date<Date>().nullish(),
  tags: z.array(TagWithIdSchema).nullish(),
});

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

interface FormComponentProps {
  onDelete?: () => void;
  onSubmit?: () => void;
  session: StopwatchSessionWithId;
}

export const EditStopwatchSession: FC<FormComponentProps> = (props) => {
  const form = useForm({
    defaultValues: {
      category: props.session.category,
      description: props.session.description,
      id: props.session.id,
      startTime: props.session.startTime,
      tags: props.session.tags ?? [],
    },
    resolver: zodResolver(updateSessionPrecursor),
  });

  const [endTime, setEndTime] = useState<Date | undefined>(new Date());
  const convertedSession = ScheduledSessionRequestSchema.create.safeParse({
    category_id: form.watch("category.id"),
    description: form.watch("description"),
    endTime,
    startTime: form.watch("startTime"),
    tag_ids: form.watch("tags")?.map((tag) => tag.id),
  }).data;

  const createSession = useCreateScheduledSession();
  const deleteSessionMutation = useDeleteStopwatchSession();
  const updateSession = useUpdateSession("stopwatch");
  const queryClient = useQueryClient();

  const onUpdateSession = async (
    values: z.infer<typeof updateSessionPrecursor>,
  ) => {
    const updateData: StopwatchSessionRequest["update"] = {
      category_id: values.category?.id,
      description: values.description,
      id: values.id,
      startTime: values.startTime,
      tag_ids: values.tags?.map((tag) => tag.id),
    };

    if (props.onSubmit) {
      props.onSubmit();
    }

    await updateSession.mutateAsync(updateData);
  };

  return (
    <Card className="border-0 gradient-container p-2">
      <CardContent className="mt-3">
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(onUpdateSession)}
          >
            <FormField
              control={form.control}
              name="category"
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

            <FormField
              control={form.control}
              name="description"
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

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => {
                  const value = form.watch("startTime");

                  return (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="flex items-center gap-2">
                        Start Time
                        {value
                          && isAfter(new Date(), value)
                          && ` (${formatTimeDifference(differenceInSeconds(new Date(), value))} ago)`}
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          onSelect={(val) => {
                            if (val && val && isBefore(new Date(), val)) {
                              form.setError("startTime", {
                                message:
                                    "Cannot set start time in the future",
                              });
                              return;
                            }

                            field.onChange(val);
                            form.clearErrors("startTime");
                          }}
                          quickOptions={dateQuickOptions}
                          selected={value ?? undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="flex items-center gap-2">
                  End Time
                </FormLabel>

                <DateTimePicker
                  onSelect={setEndTime}
                  quickOptions={dateQuickOptions}
                  selected={endTime}
                />
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      disabled={form.getValues("category") === undefined}
                      forCategory={form.watch("category") ?? undefined}
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
            <TooltipProvider delayDuration={200}>
              <div className="flex gap-2 items-center">
                <Button
                  loading={deleteSessionMutation.isPending}
                  onClick={() =>
                  { deleteSessionMutation.mutate(
                    { id: props.session.id },
                    { onSuccess: props.onDelete },
                  ); }}
                  type="button"
                  variant="destructive"
                >
                  Delete
                </Button>

                <div className="grow"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!form.formState.isDirty}
                      loading={updateSession.isPending}
                      type="submit"
                      variant="outline"
                    >
                      Update
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    The session will keep running, but will be updated with the
                    selected values
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!convertedSession}
                      loading={createSession.isPending}
                      onClick={async () => {
                        if (convertedSession) {
                          // TODO: this needs to be extracted
                          await StopwatchApi.remove({ id: props.session.id });

                          await createSession.mutateAsync(convertedSession, {

                            onSuccess: async () => {
                              await queryClient.invalidateQueries({
                                queryKey: queryKeys.sessions.active._def,
                              });

                              if (props.onSubmit) {
                                props.onSubmit();
                              }
                            },
                          });
                        }
                      }}
                      type="button"
                    >
                      Finish
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    The session will finish with the selected values
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
