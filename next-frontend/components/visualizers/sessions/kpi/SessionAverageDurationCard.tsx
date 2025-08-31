import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

interface SessionAverageDurationProviderProps {
  filter?: SessionFilterPrecursor;
}

export const SessionAverageDurationProvider = (
  props: SessionAverageDurationProviderProps,
) => {
  const {
    data: sessions,
    isError,
    isLoading,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    select: (data) => {
      if (data.length === 0) {
        return 0;
      }

      const totalAmount = data.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0,
      );
      return totalAmount / data.length;
    },
  });

  return (
    <KpiCardUiProvider
      error={isError}
      loading={isLoading}
      mapper={formatTime}
      title={"Average session duration"}
      value={sessions}
      variant={"big_value"}
    >
      <Hourglass />
    </KpiCardUiProvider>
  );
};
