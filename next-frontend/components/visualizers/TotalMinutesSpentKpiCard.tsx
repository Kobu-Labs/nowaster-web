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
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value.minutes;
    },
  });

  return (
    <KpiCardUiProvider
      loading={stats.isLoading}
      error={stats.isError}
      value={stats.data}
      mapper={(val) => val.toFixed(0)}
      title="Total Minutes Spent"
      description={
        stats.data === undefined
          ? ""
          : `That's almost ${Math.ceil(stats.data / 60).toFixed(2)} hours!`
      }
    >
      <Hourglass />
    </KpiCardUiProvider>
  );
};
