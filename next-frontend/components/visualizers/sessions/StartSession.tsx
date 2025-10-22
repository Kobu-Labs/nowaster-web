"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import type { FC } from "react";
import { useEffect, useState } from "react";

import type { StopwatchSessionWithId } from "@/api/definitions";
import { useCreateStopwatchSession } from "@/components/hooks/session/stopwatch/useCreateStopwatchSession";
import { useDeleteStopwatchSession } from "@/components/hooks/session/stopwatch/useDeleteStopwatchSession";
import { useFinishStopwatchSession } from "@/components/hooks/session/stopwatch/useFinishStopwatchSession";
import { useActiveSessions } from "@/components/hooks/useActiveSessions";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { EditStopwatchSession } from "@/components/visualizers/sessions/form/EditStopwatchSessionForm";
import { cn, formatTime } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";
import { CircleCheck, Edit, Play, Trash } from "lucide-react";

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

const NoActiveSession: FC = () => {
  const createSession = useCreateStopwatchSession();

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="group/start justify-start gap-2 bg-transparent"
            loading={createSession.isPending}
            onClick={() => {
              createSession.mutate({ startTime: new Date() });
            }}
            size="sm"
            variant="outline"
          >
            <>
              {!createSession.isPending && (
                <Play className="group-hover/start:text-green-500 size-4" />
              )}

              <Timer
                durationInSeconds={0}
                formatingFunction={formatTimeDifference}
              />
            </>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-nowrap">Start a session</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StopwatchSessionActive: FC<{
  session: StopwatchSessionWithId;
}> = ({ session }) => {
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
    <TooltipProvider delayDuration={50}>
      <Dialog modal={false} onOpenChange={setOpen} open={open}>
        <DialogContent className="w-[90vw] px-0 pb-0 max-w-[90vw] overflow-y-auto md:w-fit md:max-w-fit md:h-auto md:max-h-none md:overflow-visible md:p-6 gradient-card-solid rounded-lg">
          <DialogHeader className="px-2">
            <DialogTitle className="m-1">Edit session data</DialogTitle>
          </DialogHeader>
          <Separator className="w-full" />
          <EditStopwatchSession
            onDelete={() => setOpen(false)}
            onSubmit={() => setOpen(false)}
            session={session}
          />
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "inline-flex items-center bg-transparent text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "justify-start gap-2 relative border-2 border-pink-muted border-dashed",
          "hover:text-accent-foreground",
          "gradient-container min-h-9 rounded-md py-1",
          !session.category && "h-9",
        )}
      >
        <div className="flex justify-between w-full pr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn("flex gap-2 items-center")}
                onClick={() => {
                  setOpen(true);
                }}
                variant="ghost"
              >
                <Edit className="size-4" />
                <div className="flex flex-wrap items-center justify-center">
                  <Timer
                    durationInSeconds={displayedTime}
                    formatingFunction={formatTimeDifference}
                  />
                  {session.category && (
                    <div className="ml-2">
                      <CategoryBadge
                        color={session.category.color}
                        name={session.category.name}
                      />
                    </div>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-nowrap">
              Edit Session
            </TooltipContent>
          </Tooltip>
          <div className="flex gap-2 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-0 m-0"
                  onClick={() => {
                    finishSession.mutate(session, {
                      onError: () => {
                        setOpen(true);
                      },
                      onSuccess: () => {
                        document.title = "Nowaster";
                      },
                    });
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <CircleCheck className="hover:text-green-500 size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-nowrap">
                Finish the session
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-0 m-0"
                  onClick={() => {
                    deleteSessionMutation.mutate(
                      { id: session.id },
                      {
                        onSuccess: () => {
                          setOpen(false);
                        },
                      },
                    );
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Trash className="hover:text-red-500 size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-nowrap">
                Delete the session
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
