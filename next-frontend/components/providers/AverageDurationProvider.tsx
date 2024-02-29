import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { formatTime } from "@/lib/utils";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";
import { KpiCardVisualizer } from "@/components/visualizers/KpiCardVisualizer";

type AverageDurationProviderProps = {
  filter?: GetSessionsRequest,
}

export const AverageDurationProvider = (props: AverageDurationProviderProps) => {
  const { data: sessions } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    select: (data) => {
      if (data.isErr) {
        return 0;
      }
      const totalAmount = data.value.reduce((acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime), 0);
      return totalAmount / data.value.length;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardVisualizer variant={"big_value"} value={formatTime(sessions || 0)} title={"Average session duration"}>
      <Hourglass />
    </KpiCardVisualizer>);
};
