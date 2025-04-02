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
import { FC, useEffect, useState } from "react";
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
  ScheduledSessionWithId,
  StopwatchSessionWithId,
  TagWithIdSchema,
} from "@/api/definitions";
import { cn, formatTime } from "@/lib/utils";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { CircleCheck } from "lucide-react";
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

type StartSessionProps = {};

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

export const SessionTimer: FC<StartSessionProps> = () => {
  const activeSessions = useActiveSessions();

  if (!activeSessions.isSuccess) {
    return null;
  }

  const session = activeSessions.data.at(0);
  if (!session) {
    return <NoActiveSession />;
  }

  if (session.session_type === "stopwatch") {
    return <StopwatchSessionActive session={session} />;
  }

  const stopwatchCandidate = activeSessions.data.find(
    (s) => s.session_type === "stopwatch",
  );

  if (stopwatchCandidate) {
    return <StopwatchSessionActive session={stopwatchCandidate} />;
  }

  return <FixedSessionActive session={session} />;
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
  return (
    <div className="flex items-center justify-center">
      <Timer durationInSeconds={0} />
    </div>
  );
};

const FixedSessionActive: FC<{ session: ScheduledSessionWithId }> = ({
  session,
}) => {
  return <div></div>;
};

const StopwatchSessionActive: FC<{ session: StopwatchSessionWithId }> = ({
  session,
}) => {
  const [displayedTime, setDisplayedTime] = useState<number>(
    differenceInSeconds(new Date(), session.startTime),
  );

  const finishSession = useFinishStopwatchSession();

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = differenceInSeconds(new Date(), session.startTime);
      setDisplayedTime(newTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <Card
      className={cn(
        "px-2 flex items-center justify-center gap-2",
        finishSession.isError && "border-red-400",
      )}
    >
      <TooltipProvider delayDuration={50}>
        <Dialog modal={false}>
          <DialogTrigger className="p-1">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  className="flex items-center px-1 m-0 gap-2"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="m-1">Edit session data</DialogTitle>
              <Separator className="w-full" />
              <DialogDescription>
                <EditStopwatchSession session={session} hideBorder />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="group p-1 m-0 aspect-square"
              onClick={() => finishSession.mutate(session)}
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

const EditStopwatchSession: FC<{
  session: StopwatchSessionWithId;
  hideBorder?: boolean;
}> = ({ session, hideBorder }) => {
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

    updateSession.mutateAsync(updateData);
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
                      onSelectedCategoriesChanged={(category) => {
                        if (category === undefined) {
                          form.resetField("category");
                        } else {
                          field.onChange(category);
                        }
                      }}
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
                          onSelect={(val) => field.onChange(val)}
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

            <div className="flex ">
              <div className="grow"></div>
              <Button type="submit" loading={updateSession.isPending}>
                Update
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
