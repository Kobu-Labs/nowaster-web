import { ScheduledSessionApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { FC } from "react";
import { KpiCard } from "../KpiCard";
import { differenceInMinutes } from "date-fns";
import { formatTime } from "@/lib/utils";

type TotalTimeKpiCardProviderProps = {
  filter?: GetSessionsRequest

}
export const TotalTimeKpiCardProvider: FC<TotalTimeKpiCardProviderProps> = (props) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getSessions(props.filter);
      return data.isOk ? data.value : [];
    },
    select: (data) => data.reduce((acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime), 0),
  });

  return (
    <KpiCard variant={"big_value"} value={formatTime(result || 0)} title={"Total time"} />
  );
};
