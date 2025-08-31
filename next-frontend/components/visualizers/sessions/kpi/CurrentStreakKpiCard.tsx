import { Calendar } from "lucide-react";
import type { FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

type CurrentStreakKpiCardProps = Record<string, never>;

export const CurrentStreakKpiCard: FC<CurrentStreakKpiCardProps> = () => {
  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
    select: (data) => data.streak,
  });

  return (
    <KpiCardUiProvider
      description="Keep it going!"
      error={stats.isError}
      loading={stats.isLoading}
      title="Current Streak"
      value={stats.data}
    >
      <Calendar />
    </KpiCardUiProvider>
  );
};
