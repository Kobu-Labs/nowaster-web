import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";

import { type GroupingOptions } from "@/lib/session-grouping";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { SessionBaseAreaChartUiProvider } from "@/components/ui-providers/SessionBaseAreaChartUiProvider";

type SessionBaseChartProps = {
  groupingOpts: GroupingOptions;
  filter?: SessionFilterPrecursor;
};

export const SessionBaseAreaChart = (props: SessionBaseChartProps) => {
  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
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
