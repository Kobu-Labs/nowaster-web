import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { KpiCardVisualizer } from "@/components/visualizers/KpiCardVisualizer";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";

type SessionCountKpiCardProviderProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const SessionCountKpiCardProvider: FC<SessionCountKpiCardProviderProps> = (props) => {

  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => data.isOk ? data.value.length : 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardVisualizer variant={"big_value"} value={(result || 0).toString()} title={"Total sessions"} />
  );
};
