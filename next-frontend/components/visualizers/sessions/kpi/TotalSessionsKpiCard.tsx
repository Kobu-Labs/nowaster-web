import { AlignVerticalDistributeEnd } from "lucide-react";
import { FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

type TotalSessionsKpiCardProps = Record<string, never>;

export const TotalSessionsKpiCard: FC<TotalSessionsKpiCardProps> = () => {
  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
    select: (data) => data.session_count,
  });

  return (
    <KpiCardUiProvider
      value={stats.data}
      loading={stats.isLoading}
      error={stats.isError}
      title={"Total Sessions"}
      description={"Many more to go.."}
    >
      <AlignVerticalDistributeEnd />
    </KpiCardUiProvider>
  );
};
