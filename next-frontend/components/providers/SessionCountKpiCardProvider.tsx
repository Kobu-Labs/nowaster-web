import { ScheduledSessionApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { FC } from "react";
import { KpiCardVisualizer } from "../visualizers/KpiCardVisualizer";

type SessionCountKpiCardProviderProps = {
  filter?: GetSessionsRequest

}
export const SessionCountKpiCardProvider: FC<SessionCountKpiCardProviderProps> = (props) => {

  const { data: result } = useQuery({
    queryKey: ["sessions", props.filter],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(props.filter),
    select: (data) => data.isOk ? data.value.length : 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardVisualizer variant={"big_value"} value={(result || 0).toString()} title={"Total sessions"} />
  );
};
