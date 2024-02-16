import { ScheduledSessionApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { FC } from "react";
import { differenceInMinutes } from "date-fns";
import { formatTime } from "@/lib/utils";
import { KpiCardVisualizer } from "../visualizers/KpiCardVisualizer";

type TotalTimeKpiCardProviderProps = {
  filter?: GetSessionsRequest

}
export const TotalTimeKpiCardProvider: FC<TotalTimeKpiCardProviderProps> = (props) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(props.filter),
    select: (data) => {
      if (data.isErr) {
        return 0;
      }
      return data.value.reduce((acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime), 0);
    }
  });

  return (
    <KpiCardVisualizer variant={"big_value"} value={formatTime(result || 0)} title={"Total time"} />
  );
};
