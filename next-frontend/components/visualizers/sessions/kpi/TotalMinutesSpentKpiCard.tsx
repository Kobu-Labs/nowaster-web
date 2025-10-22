import { Hourglass } from "lucide-react";
import { type FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

type TotalSessionTimeKpiCardProps = Record<string, never>;

export const TotalSessionTimeKpiCard: FC<TotalSessionTimeKpiCardProps> = () => {
  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
    select: (data) => data.minutes,
  });

  return (
    <KpiCardUiProvider
      description={
        stats.data === undefined
          ? ""
          : `That's almost ${Math.ceil(stats.data / 60) + 1} hours!`
      }
      error={stats.isError}
      loading={stats.isLoading}
      mapper={(val) => val.toFixed(0)}
      title="Total Minutes Spent"
      value={stats.data}
    >
      <Hourglass />
    </KpiCardUiProvider>
  );
};
