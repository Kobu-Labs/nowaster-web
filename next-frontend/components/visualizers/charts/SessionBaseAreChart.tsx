import { useQuery } from "@tanstack/react-query";

import { type GroupingOptions } from "@/lib/session-grouping";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { SessionBaseAreaChartUiProvider } from "@/components/ui-providers/SessionBaseAreaChartUiProvider";
import { SessionFilter } from "@/state/chart-filter";

type SessionBaseChartProps = {
  groupingOpts: GroupingOptions
  filter?: Partial<SessionFilter>
}

export const SessionBaseAreaChart = (props: SessionBaseChartProps) => {

  const { data: result } = useQuery({
    // TODO: pass in the filter
    ...queryKeys.sessions.filtered(),
    retry: false,
    staleTime: Infinity,
    select: (data) => {
      if (data.isErr) {
        return {};
      }
      const uniqueCategories = Array.from(
        new Set(data.value.map((x) => x.category))
      );
      return { data: data.value, cats: uniqueCategories };
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <SessionBaseAreaChartUiProvider
      data={result?.data || []}
      groupingOpts={props.groupingOpts}
    />
  );
};
