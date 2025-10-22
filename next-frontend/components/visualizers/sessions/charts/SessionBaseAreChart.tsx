import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SessionBaseAreaChartUiProvider } from "@/components/ui-providers/session/charts/SessionBaseAreaChartUiProvider";
import type { GroupingOptions } from "@/lib/session-grouping";

type SessionBaseChartProps = {
  filter?: SessionFilterPrecursor;
  groupingOpts: GroupingOptions;
};

export const SessionBaseAreaChart = (props: SessionBaseChartProps) => {
  const result = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  if (result.isPending) {
    return <Skeleton className="size-full" />;
  }

  if (result.isError) {
    return <span>Error occured</span>;
  }

  return (
    <SessionBaseAreaChartUiProvider
      data={result.data}
      groupingOpts={props.groupingOpts}
    />
  );
};
