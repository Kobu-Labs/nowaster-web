import { ScheduledSessionApi } from "@/api";
import { formatTime } from "@/lib/utils";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { Hourglass } from "lucide-react";
import { KpiCard } from "../KpiCard";

type AverageDurationProviderProps = {
  filter?: GetSessionsRequest,
}

export const AverageDurationProvider = (props: AverageDurationProviderProps) => {
  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getSessions(props.filter);
      return data.isOk ? data.value : [];
    },
    select: (data) => {
      const totalAmount = data.reduce((acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime), 0);
      return totalAmount / data.length;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCard variant={"big_value"} value={formatTime(result || 0)} title={"Average session duration"}>
      <Hourglass />
    </KpiCard>);
};
