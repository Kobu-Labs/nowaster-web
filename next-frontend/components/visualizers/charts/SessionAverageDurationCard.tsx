import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

type SessionAverageDurationProviderProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const SessionAverageDurationProvider = (
  props: SessionAverageDurationProviderProps
) => {
  const { data: sessions } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    select: (data) => {
      if (data.isErr) {
        return 0;
      }
      const totalAmount = data.value.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0
      );
      return totalAmount / data.value.length;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardUiProvider
      variant={"big_value"}
      value={formatTime(sessions || 0)}
      title={"Average session duration"}
    >
      <Hourglass />
    </KpiCardUiProvider>
  );
};
