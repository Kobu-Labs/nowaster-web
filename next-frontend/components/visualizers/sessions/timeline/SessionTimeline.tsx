import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SessionTimelineUiProvider } from "@/components/ui-providers/session/SessionTimelineUiProvider";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { subHours } from "date-fns";
import type { FC} from "react";
import { useMemo } from "react";

interface SessionTimelineProps {
  filter?: SessionFilterPrecursor;
}

export const SessionTimeline: FC<SessionTimelineProps> = (props) => {
  const sessions = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    placeholderData: keepPreviousData,
  });

  const data = useMemo(() => {
    const result = {
      endDate: props.filter?.data.endTimeTo?.value ?? new Date(),
      startDate:
        props.filter?.data.endTimeFrom?.value ?? subHours(new Date(), 48),
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
      endDate={data.endDate}
      sessions={sessions.data}
      startDate={data.startDate}
    />
  );
};
