import { AlignVerticalDistributeEnd } from "lucide-react";
import type { FC } from "react";
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
      description={"Many more to go.."}
      error={stats.isError}
      loading={stats.isLoading}
      title={"Total Sessions"}
      value={stats.data}
    >
      <AlignVerticalDistributeEnd />
    </KpiCardUiProvider>
  );
};
