import { ScheduledSessionApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { FC } from "react";
import { KpiCardVisualizer } from "../visualizers/KpiCardVisualizer";

type SessionCountKpiCardProviderProps = {
  filter? : GetSessionsRequest

}
export const SessionCountKpiCardProvider:FC<SessionCountKpiCardProviderProps> = (props) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getSessions(props.filter);
      return data.isOk ? data.value : [];
    },
    select: (data) => data.length,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardVisualizer variant={"big_value"} value={(result || 0).toString()} title={"Total sessions"}/>
  );
};
