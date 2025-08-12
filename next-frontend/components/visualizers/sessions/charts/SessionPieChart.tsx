import { ScheduledSession } from "@/api/definitions";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { SessionPieChartUiProvider } from "@/components/ui-providers/session/charts/SessionPieChartUiProvider";
import { differenceInMinutes } from "date-fns";
import { createContext, FC, useContext, useState } from "react";

type SessionPieChartProps<TMetadata = any> = {
  filter?: SessionFilterPrecursor;
  getKey: (session: ScheduledSession) => KeyExtractionResult<TMetadata>;
  groupingMethod?: (session: ScheduledSession) => number;
  postProcess?: (
    data: AmountByCategory<TMetadata>[],
  ) => AmountByCategory<TMetadata>[];
  renderLegend?: FC<{ data: AmountByCategory[] }>;
};

type GroupedDataItem<TMetadata = any> = {
  key: string;
  value: number;
  metadata?: TMetadata;
};

export type AmountByCategory<TMetadata = any> = GroupedDataItem<TMetadata>;

type KeyExtractionResult<TMetadata = any> =
  | {
      key: string;
      metadata?: TMetadata;
    }
  | {
      key: string;
      metadata?: TMetadata;
    }[];

export const groupData = <TMetadata = any,>(
  sessions: ScheduledSession[],
  getKey: (session: ScheduledSession) => KeyExtractionResult<TMetadata>,
  groupingMethod: (session: ScheduledSession) => number,
): AmountByCategory<TMetadata>[] => {
  const result: { [key: string]: { value: number; metadata?: TMetadata } } = {};

  sessions.forEach((session) => {
    const keyResult = getKey(session);
    const keyResults = Array.isArray(keyResult) ? keyResult : [keyResult];

    keyResults.forEach(({ key, metadata }) => {
      if (result[key] === undefined) {
        result[key] = { value: 0, metadata };
      }

      result[key].value += groupingMethod(session);
    });
  });

  return Object.entries(result).map(([key, { value, metadata }]) => ({
    key,
    value,
    metadata,
  }));
};

const SessionPieChartInner = <TMetadata = any,>(
  props: SessionPieChartProps<TMetadata>,
) => {
  // differenceInMinutes as default grouping method
  const groupingMethod =
    props.groupingMethod ??
    ((session: ScheduledSession) =>
      differenceInMinutes(session.endTime, session.startTime));

  const context = useContext(ActiveIndexContext);
  if (!context) {
    return null;
  }
  const setIndex = (val: number | undefined) => {
    if (val !== undefined) {
      context.setIndex(val);
    } else {
      context.setIndex(null);
    }
  };
  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      const groupedData = groupData(data, props.getKey, groupingMethod);
      return props.postProcess ? props.postProcess(groupedData) : groupedData;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <div className="flex items-center">
      <SessionPieChartUiProvider
        data={result ?? []}
        activeIndex={context.index}
        onActiveIndexChange={setIndex}
      />
      {props.renderLegend && props.renderLegend({ data: result ?? [] })}
    </div>
  );
};

type ActiveIndexContextType = {
  index: number | null;
  setIndex: (value: number | null) => void;
};

export const ActiveIndexContext = createContext<
  ActiveIndexContextType | undefined
>(undefined);

export const SessionPieChart: FC<SessionPieChartProps> = (props) => {
  const [filter, setFilter] = useState<number | null>(null);

  return (
    <ActiveIndexContext.Provider value={{ index: filter, setIndex: setFilter }}>
      <SessionPieChartInner {...props} />
    </ActiveIndexContext.Provider>
  );
};
