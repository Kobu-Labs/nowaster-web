"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useForm } from "react-hook-form";
import {
  addHours,
  addMinutes,
  isAfter,
  isBefore,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";

import { useActiveSessions } from "@/components/hooks/useActiveSessions";
import { differenceInSeconds } from "date-fns";
import {
  CategoryWithIdSchema,
  StopwatchSessionWithId,
  TagWithIdSchema,
} from "@/api/definitions";
import { cn, formatTime } from "@/lib/utils";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { CircleCheck, Play } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { StopwatchSessionRequest } from "@/api/definitions/requests/stopwatch-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { Input } from "@/components/shadcn/input";
import {
  DateTimePicker,
  QuickOption,
} from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { z } from "zod";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { Separator } from "@/components/shadcn/separator";
import { useFinishStopwatchSession } from "@/components/hooks/session/stopwatch/useFinishStopwatchSession";
import { useCreateStopwatchSession } from "@/components/hooks/session/stopwatch/useCreateStopwatchSession";
import React from "react";
import { StopwatchApi } from "@/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTable } from "@/components/ui-providers/DataTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";

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

const creationFormQuickOptions: QuickOption[] = [
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

export const SessionTimer: FC = () => {
  const activeSessions = useActiveSessions();

  if (!activeSessions.isSuccess) {
    return null;
  }

  const stopwatchCandidate = activeSessions.data.find(
    (s) => s.session_type === "stopwatch",
  );

  if (stopwatchCandidate) {
    return <StopwatchSessionActive session={stopwatchCandidate} />;
  }
  return <NoActiveSession />;
};

type TimerProps = {
  durationInSeconds: number;
  formatingFunction?: (duration: number) => string;
};

const Timer: FC<TimerProps> = (props) => {
  let duration = formatTime(props.durationInSeconds / 60);
  if (props.formatingFunction) {
    duration = props.formatingFunction(props.durationInSeconds);
  }
  return <div className="flex items-center">{duration}</div>;
};

const NoActiveSession: FC = ({}) => {
  const createSession = useCreateStopwatchSession();

  return (
    <Card
      className={cn(
        "px-2 p-1 flex items-center justify-center gap-2",
        createSession.isError && "border-red-400",
      )}
    >
      <TooltipProvider delayDuration={50}>
        <div className="flex items-center px-1 m-0 gap-3 rounded-md text-sm ">
          <Timer
            durationInSeconds={0}
            formatingFunction={formatTimeDifference}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="group p-1 m-0 aspect-square"
              onClick={() => createSession.mutate({ startTime: new Date() })}
              loading={createSession.isPending}
            >
              {!createSession.isPending && (
                <Play className="group-hover:text-green-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-nowrap">
            Start a session
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
};

const StopwatchSessionActive: FC<{ session: StopwatchSessionWithId }> = ({
  session,
}) => {
  const [displayedTime, setDisplayedTime] = useState<number>(
    differenceInSeconds(new Date(), session.startTime),
  );
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const finishSession = useFinishStopwatchSession();
  const [globalErr, setGlobalErr] = useState(false);
  const formRef = useRef<FormHandle>(null);
  const filter = useMemo(
    () => ({
      endTimeTo: { value: new Date() },
      endTimeFrom: { value: subHours(new Date(), 48) },
    }),
    [],
  );
  const pastSessionQuery = useQuery({
    ...queryKeys.sessions.filtered({
      settings: {},
      data: filter,
    }),
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value.slice(0, 20);
    },
  });

  const onInteractOutside = async () => {
    const isValid = await formRef.current?.validate();
    if (!isValid) {
      setGlobalErr(true);
      return;
    }
    const formValues = formRef.current?.prepareData();
    if (!formValues) {
      setGlobalErr(true);
      return;
    }

    const result = await StopwatchApi.update(formValues);
    setGlobalErr(result.isErr);
    if (result.isOk) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active._def,
      });
    }
    setOpen(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = differenceInSeconds(new Date(), session.startTime);
      setDisplayedTime(newTime);
      const formatted = formatTimeDifference(newTime);
      const category = session.category ? ` [${session.category.name}]` : "";
      document.title = `${formatted}${category}`;
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <Card className="px-2 flex items-center justify-center gap-2">
      <TooltipProvider delayDuration={50}>
        <Dialog modal={false} open={open} onOpenChange={setOpen}>
          <DialogTrigger className="p-1">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={() => setOpen(true)}
                  variant="ghost"
                  className={cn(
                    "flex items-center px-1 m-0 gap-2 relative",
                    globalErr &&
                      "border-2 animate-[border-pulse_0.5s_ease-in-out_infinite]",
                  )}
                >
                  {session.category && (
                    <CategoryBadge
                      color={session.category.color}
                      name={session.category.name}
                    />
                  )}
                  <Timer
                    durationInSeconds={displayedTime}
                    formatingFunction={formatTimeDifference}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-nowrap">
                Edit session
              </TooltipContent>
            </Tooltip>
          </DialogTrigger>
          {open && (
            <div
              className={cn(
                "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              )}
            />
          )}
          <DialogContent
            onInteractOutside={onInteractOutside}
            className="[&>button]:hidden max-w-[60%] w-full"
          >
            <DialogHeader>
              <DialogTitle className="m-1">Edit session data</DialogTitle>
              <Separator className="w-full" />
              <DialogDescription>
                <EditStopwatchSession ref={formRef} session={session} />
                <h2 className="text-bold text-xl my-4">
                  Some of the last sessions you had in the past 48 hours!
                </h2>
                <ScrollArea className="h-64" type="always">
                  <DataTable
                    loading={pastSessionQuery.isLoading}
                    columns={BaseSessionTableColumns}
                    data={pastSessionQuery.data ?? []}
                  />
                  <ScrollBar />
                </ScrollArea>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="group p-1 m-0 aspect-square"
              onClick={() =>
                finishSession.mutate(session, {
                  onSuccess: () => {
                    document.title = "Nowaster";
                    setGlobalErr(false);
                  },
                  onError: () => setGlobalErr(true),
                })
              }
              loading={finishSession.isPending}
            >
              {!finishSession.isPending && (
                <CircleCheck className="group-hover:text-green-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-nowrap">
            Finish the session
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
};

const updatePrecursor = z.object({
  id: z.string().uuid(),
  startTime: z.coerce.date().nullish(),
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullish(),
  tags: z.array(TagWithIdSchema).nullish(),
});

export type FormHandle = {
  validate: () => Promise<boolean>;
  prepareData: () => StopwatchSessionRequest["update"];
};

interface FormComponentProps {
  onSubmit?: (values: z.infer<typeof updatePrecursor>) => void;
  session: StopwatchSessionWithId;
  hideBorder?: boolean;
}

const EditStopwatchSession = React.forwardRef<FormHandle, FormComponentProps>(
  ({ session, hideBorder }, ref) => {
    const form = useForm<z.infer<typeof updatePrecursor>>({
      resolver: zodResolver(updatePrecursor),
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

    async function onSubmit(values: z.infer<typeof updatePrecursor>) {
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
                            quickOptions={creationFormQuickOptions}
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
  },
);
EditStopwatchSession.displayName = "EditStopwatchSession";
