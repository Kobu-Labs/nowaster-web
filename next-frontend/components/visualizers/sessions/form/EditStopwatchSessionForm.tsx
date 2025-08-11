"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { StopwatchApi } from "@/api";
import {
  CategoryWithIdSchema,
  ScheduledSessionRequestSchema,
  StopwatchSessionRequest,
  StopwatchSessionWithId,
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
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInSeconds, isAfter, isBefore } from "date-fns";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const updateSessionPrecursor = z.object({
  id: z.string().uuid(),
  startTime: z.coerce.date().nullish(),
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullish(),
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
  onSubmit?: () => void;
  session: StopwatchSessionWithId;
  onDelete?: () => void;
}

export const EditStopwatchSession: FC<FormComponentProps> = (props) => {
  const form = useForm<z.infer<typeof updateSessionPrecursor>>({
    resolver: zodResolver(updateSessionPrecursor),
    defaultValues: {
      id: props.session.id,
      startTime: props.session.startTime,
      category: props.session.category,
      description: props.session.description,
      tags: props.session.tags ?? [],
    },
  });

  const [endTime, setEndTime] = useState<Date | undefined>(new Date());
  const convertedSession = ScheduledSessionRequestSchema.create.safeParse({
    startTime: form.watch("startTime"),
    endTime: endTime,
    category_id: form.watch("category.id"),
    description: form.watch("description"),
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
      id: values.id,
      startTime: values.startTime,
      category_id: values.category?.id,
      description: values.description,
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
            onSubmit={form.handleSubmit(onUpdateSession)}
            className="space-y-8"
          >
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
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="flex items-center gap-2">
                  End Time
                </FormLabel>

                <DateTimePicker
                  quickOptions={dateQuickOptions}
                  selected={endTime}
                  onSelect={setEndTime}
                />
              </FormItem>
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
            <TooltipProvider delayDuration={200}>
              <div className="flex gap-2 items-center">
                <Button
                  loading={deleteSessionMutation.isPending}
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    deleteSessionMutation.mutate(
                      { id: props.session.id },
                      { onSuccess: props.onDelete },
                    )
                  }
                >
                  Delete
                </Button>

                <div className="grow"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      variant="outline"
                      loading={updateSession.isPending}
                      disabled={!form.formState.isDirty}
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
                      type="button"
                      loading={createSession.isPending}
                      disabled={!convertedSession}
                      onClick={async () => {
                        if (convertedSession) {
                          // TODO: this needs to be extracted
                          await StopwatchApi.remove({ id: props.session.id });

                          await createSession.mutateAsync(convertedSession, {
                            /* eslint-disable @typescript-eslint/no-misused-promises */
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
