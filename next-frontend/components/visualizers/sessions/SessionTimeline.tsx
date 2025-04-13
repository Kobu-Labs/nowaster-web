import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SessionTimelineUiProvider } from "@/components/ui-providers/session/SessionTimelineUiProvider";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { subHours } from "date-fns";
import { FC, useMemo } from "react";

type SessionTimelineProps = {
  filter?: SessionFilterPrecursor;
};

export const SessionTimeline: FC<SessionTimelineProps> = (props) => {
  const sessions = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    placeholderData: keepPreviousData,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value;
    },
  });

  const data = useMemo(() => {
    const result = {
      startDate:
        props.filter?.data.endTimeFrom?.value ?? subHours(new Date(), 48),
      endDate: props.filter?.data.endTimeTo?.value ?? new Date(),
    };
    return result;
  }, [props.filter]);

  if (sessions.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (sessions.isError) {
    return <div>Error: {sessions.error.message}</div>;
  }

  return (
    <SessionTimelineUiProvider
      sessions={sessions.data}
      startDate={data.startDate}
      endDate={data.endDate}
    />
  );
};
