import { Calendar } from "lucide-react";
import { FC } from "react";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/shadcn/skeleton";

type CurrentStreakKpiCardProps = Record<string, never>

export const CurrentStreakKpiCard: FC<CurrentStreakKpiCardProps> = () => {
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
      value={stats.data.value.streak}
      title="Current Streak"
      description="Keep it going!"
    >
      <Calendar />
    </KpiCardUiProvider>
  );
};
