import { Hourglass } from "lucide-react";
import { type FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/shadcn/skeleton";

type TotalSessionTimeKpiCardProps = Record<string, never>

export const TotalSessionTimeKpiCard: FC<TotalSessionTimeKpiCardProps> = () => {
  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
  });

  if (stats.isPending) {
    return <Skeleton />;
  }

  if (stats.isError || stats.data.isErr) {
    return <span>Error occured</span>;
  }

  return (
    <KpiCardUiProvider
      value={stats.data.value.minutes.toFixed(0)}
      title="Total Minutes Spent"
      description={`That's almost ${Math.ceil(
        stats.data.value.minutes / 60
      ).toFixed(2)} hours!`}
    >

      <Hourglass />
    </KpiCardUiProvider>

  );
};
