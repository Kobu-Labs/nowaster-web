import { ScheduledSessionApi } from "@/api";
import { formatTime } from "@/lib/utils";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";
import { KpiCardVisualizer } from "../visualizers/KpiCardVisualizer";

type AverageDurationProviderProps = {
  filter?: GetSessionsRequest,
}

export const AverageDurationProvider = (props: AverageDurationProviderProps) => {
  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(props.filter),
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
    <KpiCardVisualizer variant={"big_value"} value={formatTime(result || 0)} title={"Average session duration"}>
      <Hourglass />
    </KpiCardVisualizer>);
};
