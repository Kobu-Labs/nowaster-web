import type { ScheduledSession } from "@/api/definitions";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { SessionPieChartUiProvider } from "@/components/ui-providers/session/charts/SessionPieChartUiProvider";
import { differenceInMinutes } from "date-fns";
import type { FC } from "react";
import { createContext, use, useState } from "react";

export type AmountByCategory<TMetadata = any> = GroupedDataItem<TMetadata>;

interface GroupedDataItem<TMetadata = any> {
  key: string;
  metadata?: TMetadata;
  value: number;
}

type KeyExtractionResult<TMetadata = any> =
  | {
      key: string;
      metadata?: TMetadata;
    }
  | {
      key: string;
      metadata?: TMetadata;
    }[];

interface SessionPieChartProps<TMetadata = any> {
  filter?: SessionFilterPrecursor;
  getKey: (session: ScheduledSession) => KeyExtractionResult<TMetadata>;
  groupingMethod?: (session: ScheduledSession) => number;
  postProcess?: (
    data: AmountByCategory<TMetadata>[],
  ) => AmountByCategory<TMetadata>[];
  renderLegend?: FC<{ data: AmountByCategory[] }>;
}

export const groupData = <TMetadata = any,>(
  sessions: ScheduledSession[],
  getKey: (session: ScheduledSession) => KeyExtractionResult<TMetadata>,
  groupingMethod: (session: ScheduledSession) => number,
): AmountByCategory<TMetadata>[] => {
  const result: Record<string, { metadata?: TMetadata; value: number }> = {};

  sessions.forEach((session) => {
    const keyResult = getKey(session);
    const keyResults = Array.isArray(keyResult) ? keyResult : [keyResult];

    keyResults.forEach(({ key, metadata }) => {
      result[key] ??= { metadata, value: 0 };
      result[key].value += groupingMethod(session);
    });
  });

  return Object.entries(result).map(([key, { metadata, value }]) => ({
    key,
    metadata,
    value,
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

  const context = use(ActiveIndexContext);

  const setIndex = (val: number | undefined) => {
    if (val === undefined) {
      context?.setIndex(null);
    } else {
      context?.setIndex(val);
    }
  };

  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    select: (data) => {
      const groupedData = groupData(data, props.getKey, groupingMethod);
      return props.postProcess ? props.postProcess(groupedData) : groupedData;
    },
  });

  if (!context) {
    return null;
  }

  return (
    <div className="flex items-center">
      <SessionPieChartUiProvider
        activeIndex={context.index}
        data={result ?? []}
        onActiveIndexChange={setIndex}
      />
      {props.renderLegend && !!result?.length && (
        <props.renderLegend data={result ?? []} />
      )}
    </div>
  );
};

interface ActiveIndexContextType {
  index: null | number;
  setIndex: (value: null | number) => void;
}

export const ActiveIndexContext = createContext<
  ActiveIndexContextType | undefined
>(undefined);

export const SessionPieChart: FC<SessionPieChartProps> = (props) => {
  const [filter, setFilter] = useState<null | number>(null);

  return (
    <ActiveIndexContext value={{ index: filter, setIndex: setFilter }}>
      <SessionPieChartInner {...props} />
    </ActiveIndexContext>
  );
};
