import { OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";
import { useQuery } from "@tanstack/react-query";
import { type GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { type GroupingOptions } from "@/lib/session-grouping";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";


type OverviewChartProps = {
  groupingOpts: GroupingOptions
  filter?: Partial<GetSessionsRequest>
}

export const OverviewAreaChartProvider = (props: OverviewChartProps) => {

  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    staleTime: Infinity,
    select: (data) => {
      if (data.isErr) {
        return {};
      }
      const uniqueCategories = Array.from(new Set(data.value.map(x => x.category)));
      return { data: data.value, cats: uniqueCategories };
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <OverviewAreaChartVisualizer
      data={result?.data || []}
      groupingOpts={props.groupingOpts}
    />
  );
};
