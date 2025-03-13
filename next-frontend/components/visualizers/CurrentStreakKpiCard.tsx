import { Calendar } from "lucide-react";
import { FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

type CurrentStreakKpiCardProps = Record<string, never>;

export const CurrentStreakKpiCard: FC<CurrentStreakKpiCardProps> = () => {
  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value.streak;
    },
  });

  return (
    <KpiCardUiProvider
      value={stats.data}
      loading={stats.isLoading}
      error={stats.isError}
      title="Current Streak"
      description="Keep it going!"
    >
      <Calendar />
    </KpiCardUiProvider>
  );
};
