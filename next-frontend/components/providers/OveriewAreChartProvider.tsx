import { useQuery } from "@tanstack/react-query";
import { OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";
import { ScheduledSessionApi } from "@/api";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { Granularity, granularizers, groupSessionsByKey } from "@/lib/session-grouping";


type OverviewChartProps = {
  granularity: keyof typeof Granularity,
  filter?: Partial<GetSessionsRequest>
  ticks?: number[],
}

/* BUG: issue with selecting initial granularity (before it got cached) - chart flickers */
export const OverviewAreaChartProvider = (props: OverviewChartProps) => {
  const granularizer = granularizers[props.granularity];

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getSessions(props.filter);
      return data.isOk ? data.value : [];
    },
    select: (data) => {
      const uniqueCategories = Array.from(new Set(data.map(x => x.category)));
      return { data: groupSessionsByKey(granularizer, data), cats: uniqueCategories };
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <OverviewAreaChartVisualizer
      granularity={props.granularity}
      data={result?.data || []}
      categories={result?.cats || []}
      ticks={props.ticks}
    />
  );
};
