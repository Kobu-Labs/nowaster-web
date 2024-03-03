import { useQuery } from "@tanstack/react-query";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { PieChartSessionVisualizer } from "../visualizers/PieChartSessionVisualizer";
import { ScheduledSession } from "@/validation/models";
import { differenceInMinutes } from "date-fns";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";


type PieChartSessionProviderProps = {
  filter?: Partial<GetSessionsRequest>
  groupingFn: (session: ScheduledSession) => string | string[]
  postProcess?: (data: AmountByCategory[]) => AmountByCategory[]
}

export type AmountByCategory = { key: string, value: number }

const groupData = (sessions: ScheduledSession[], groupingFn: (session: ScheduledSession) => string | string[]): AmountByCategory[] => {
  const result: { [key: string]: number } = {};
  sessions.forEach(session => {
    const key = groupingFn(session);
    if (Array.isArray(key)) {
      key.forEach(val => {
        if (result[val] === undefined) {
          result[val] = 0;
        }
        result[val] += differenceInMinutes(session.endTime, session.startTime);
      });
    } else {
      if (result[key] === undefined) {
        result[key] = 0;
      }
      result[key] += differenceInMinutes(session.endTime, session.startTime);
    }
  });

  return Object.entries(result).map(([key, val]) => { return { key: key, value: val }; });
};

export const PieChartSessionProvider = (props: PieChartSessionProviderProps) => {
  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      if (data.isErr) {
        return [];
      }
      const groupedData = groupData(data.value, props.groupingFn);
      return props.postProcess ? props.postProcess(groupedData) : groupedData;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <PieChartSessionVisualizer
      data={result || []}
    />
  );
};