"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { FC, useEffect, useState } from "react";

import { StopwatchSessionWithId } from "@/api/definitions";
import { useCreateStopwatchSession } from "@/components/hooks/session/stopwatch/useCreateStopwatchSession";
import { useFinishStopwatchSession } from "@/components/hooks/session/stopwatch/useFinishStopwatchSession";
import { useActiveSessions } from "@/components/hooks/useActiveSessions";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { EditStopwatchSession } from "@/components/visualizers/sessions/form/EditStopwatchSessionForm";
import { cn, formatTime } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";
import { CircleCheck, Play, Trash } from "lucide-react";
import { useDeleteStopwatchSession } from "@/components/hooks/session/stopwatch/useDeleteStopwatchSession";

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
  const finishSession = useFinishStopwatchSession();
  const deleteSessionMutation = useDeleteStopwatchSession();

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
    <Card className="px-2 flex items-center justify-center">
      <TooltipProvider delayDuration={50}>
        <Dialog modal={false} open={open} onOpenChange={setOpen}>
          <DialogTrigger className="p-1">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={() => setOpen(true)}
                  variant="ghost"
                  className="flex items-center px-1 m-0 gap-2 relative"
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
          <DialogContent className="w-1/2">
            <DialogHeader>
              <DialogTitle className="m-1">Edit session data</DialogTitle>
              <Separator className="w-full" />
              <DialogDescription>
                <EditStopwatchSession
                  session={session}
                  onDelete={() => setOpen(false)}
                  onSubmit={() => setOpen(false)}
                />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="group p-0 m-0 aspect-square"
              onClick={() =>
                finishSession.mutate(session, {
                  onSuccess: () => {
                    document.title = "Nowaster";
                  },
                  onError: () => setOpen(true),
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="group p-0 m-0 aspect-square"
              onClick={() =>
                deleteSessionMutation.mutate(
                  { id: session.id },
                  {
                    onSuccess: () => setOpen(false),
                  },
                )
              }
              loading={deleteSessionMutation.isPending}
            >
              {!deleteSessionMutation.isPending && (
                <Trash className="group-hover:text-red-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-nowrap">
            Delete the session
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
};
