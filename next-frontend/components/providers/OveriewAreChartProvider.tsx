import { useQuery } from "@tanstack/react-query";
import { GroupingOptions, OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";
import { ScheduledSessionApi } from "@/api";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";


type OverviewChartProps = {
  groupingOpts:GroupingOptions
  filter?: Partial<GetSessionsRequest>
}

/* BUG: issue with selecting initial granularity (before it got cached) - chart flickers */
export const OverviewAreaChartProvider = (props: OverviewChartProps) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getSessions(props.filter);
      return data.isOk ? data.value : [];
    },
    select: (data) => {
      const uniqueCategories = Array.from(new Set(data.map(x => x.category)));
      return { data: data, cats: uniqueCategories };
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
