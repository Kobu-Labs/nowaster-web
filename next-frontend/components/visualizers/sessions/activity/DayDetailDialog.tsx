import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SessionCard } from "@/components/visualizers/sessions/SessionCard";
import { formatTime } from "@/lib/utils";
import type { SessionFilterPrecursor } from "@/state/chart-filter";

type DayDetailDialogProps = {
  date: Date | null;
  onOpenChange: (open: boolean) => void;
};

export const DayDetailDialog: FC<DayDetailDialogProps> = ({
  date,
  onOpenChange,
}) => {
  // date is only null while closed; enabled:false then skips the fetch, so
  // this placeholder range is never actually requested.
  const referenceDate = date ?? new Date();
  const filter: SessionFilterPrecursor = {
    data: {
      startTimeFrom: { value: startOfDay(referenceDate) },
      startTimeTo: { value: endOfDay(referenceDate) },
    },
    settings: {},
  };

  const { data: sessions, isPending } = useQuery({
    ...queryKeys.sessions.filtered(filter),
    enabled: date !== null,
  });

  const totalMinutes
    = sessions?.reduce(
      (acc, session) =>
        acc + differenceInMinutes(session.endTime, session.startTime),
      0,
    ) ?? 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={date !== null}>
      <DialogContent className="max-h-[80vh] gradient-card-solid overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {date ? format(date, "EEEE, MMM d, yyyy") : ""}
          </DialogTitle>
          {!isPending && (
            <p className="text-sm text-muted-foreground">
              {formatTime(totalMinutes)}
              {" "}
              tracked across
              {" "}
              {sessions?.length ?? 0}
              {" "}
              session
              {sessions?.length === 1 ? "" : "s"}
            </p>
          )}
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-2">
          {isPending && <Skeleton className="h-24 w-full" />}
          {!isPending
            && sessions?.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                variant="borderless"
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
