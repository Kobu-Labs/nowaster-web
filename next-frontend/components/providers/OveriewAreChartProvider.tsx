import { useQuery } from "@tanstack/react-query";
import { OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";
import { ScheduledSessionApi } from "@/api";
import { type GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { type GroupingOptions } from "@/lib/session-grouping";


type OverviewChartProps = {
  groupingOpts: GroupingOptions
  filter?: Partial<GetSessionsRequest>
}

/* BUG: issue with selecting initial granularity (before it got cached) - chart flickers */
export const OverviewAreaChartProvider = (props: OverviewChartProps) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(props.filter),
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
