import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";

import { type GroupingOptions } from "@/lib/session-grouping";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { SessionBaseAreaChartUiProvider } from "@/components/ui-providers/SessionBaseAreaChartUiProvider";
import { Skeleton } from "@/components/shadcn/skeleton";

type SessionBaseChartProps = {
  groupingOpts: GroupingOptions;
  filter?: SessionFilterPrecursor;
};

export const SessionBaseAreaChart = (props: SessionBaseChartProps) => {
  const result = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (result.isPending) {
    return <Skeleton className="size-full" />;

  }

  if (result.isError || result.data.isErr) {
    return <span>Error occured</span>;
  }

  return (
    <SessionBaseAreaChartUiProvider
      data={result.data.value}
      groupingOpts={props.groupingOpts}
    />
  );
};
