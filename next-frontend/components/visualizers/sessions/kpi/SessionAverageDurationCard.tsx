import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

type SessionAverageDurationProviderProps = {
  filter?: SessionFilterPrecursor;
};

export const SessionAverageDurationProvider = (
  props: SessionAverageDurationProviderProps,
) => {
  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardUiProvider
      loading={isLoading}
      error={isError}
      mapper={formatTime}
      variant={"big_value"}
      value={sessions}
      title={"Average session duration"}
    >
      <Hourglass />
    </KpiCardUiProvider>
  );
};
