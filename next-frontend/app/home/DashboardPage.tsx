"use client";

import { CategoryWithId, ScheduledSession } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { SessionPieChartUiProvider } from "@/components/ui-providers/session/charts/SessionPieChartUiProvider";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { Feed } from "@/components/visualizers/feed/Feed";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import {
  AmountByCategory,
  groupData,
  SessionPieChartProps,
} from "@/components/visualizers/sessions/charts/SessionPieChart";
import { CurrentStreakKpiCard } from "@/components/visualizers/sessions/kpi/CurrentStreakKpiCard";
import { TotalSessionTimeKpiCard } from "@/components/visualizers/sessions/kpi/TotalMinutesSpentKpiCard";
import { TotalSessionsKpiCard } from "@/components/visualizers/sessions/kpi/TotalSessionsKpiCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { FilteredSessionTimeline } from "@/components/visualizers/sessions/timeline/FilteredSessionTimeline";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { formatTime } from "@/lib/utils";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import {
  addHours,
  differenceInMinutes,
  endOfDay,
  startOfDay,
  subDays,
  subHours,
} from "date-fns";
import { TrendingDown, TrendingUp, TrendingUpDown } from "lucide-react";
import { createContext, FC, useContext, useMemo, useState } from "react";

export default function DashboardPage() {
  const timelineFilter: SessionFilterPrecursor = useMemo(
    () => ({
      settings: {},
      data: {
        endTimeFrom: { value: subHours(new Date(), 20) },
        endTimeTo: { value: addHours(new Date(), 1) },
      },
    }),
    [],
  );

  const todayFilter: SessionFilterPrecursor = useMemo(
    () => ({
      settings: {},
      data: {
        endTimeFrom: { value: startOfDay(new Date()) },
        endTimeTo: { value: endOfDay(new Date()) },
      },
    }),
    [],
  );

  const yesterdayFilter: SessionFilterPrecursor = useMemo(
    () => ({
      settings: {},
      data: {
        endTimeFrom: { value: startOfDay(subDays(new Date(), 1)) },
        endTimeTo: { value: endOfDay(subDays(new Date(), 1)) },
      },
    }),
    [],
  );

  const { data: todayMinutes } = useQuery({
    ...queryKeys.sessions.filtered(todayFilter),
    retry: false,
    select: (data) => {
      return data.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0,
      );
    },
  });

  const { data: yesterdayMinutes } = useQuery({
    ...queryKeys.sessions.filtered(yesterdayFilter),
    retry: false,
    select: (data) => {
      return data.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0,
      );
    },
  });

  const percentageChange = useMemo(() => {
    if (todayMinutes === undefined || yesterdayMinutes === undefined) {
      return null;
    }

    if (yesterdayMinutes === 0) {
      if (todayMinutes === 0) {
        return (
          <div className="flex gap-2">
            <TrendingUpDown className="text-red-500" />
            +0%
          </div>
        );
      }
      return (
        <div className="flex gap-2">
          <TrendingUp className="text-green-400" />
          +100%
        </div>
      );
    }

    const change = ((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100;
    if (change >= 0) {
      return (
        <div className="flex gap-2">
          <TrendingUp className="text-green-400" />
          {`+${Math.round(change)}% vs yesterday`}
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <TrendingDown className="text-red-500" />
        {`${Math.round(change)}% vs yesterday`}
      </div>
    );
  }, [todayMinutes, yesterdayMinutes]);

  return (
    <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TotalSessionTimeCard
          filter={todayFilter}
          variant="default"
          description={percentageChange ?? "Loading..."}
          title="Time tracked today"
        />
        <TotalSessionsKpiCard />
        <TotalSessionTimeKpiCard />
        <CurrentStreakKpiCard />
        <FilterContextProvider>
          <FilteredSessionAreaChart
            initialGranularity="days-in-month"
            className="col-span-full h-[400px]"
          />
        </FilterContextProvider>
        <FilterContextProvider initialFilter={timelineFilter}>
          <div className="col-span-full">
            <FilteredSessionTimeline />
          </div>
        </FilterContextProvider>
        <Card className="col-span-full md:col-span-2">
          <CardHeader className="p-2">
            <h2 className="text-xl font-bold tracking-tight">
              Today&apos;s categories
            </h2>
          </CardHeader>
          <CardContent className="p-2">
            <SessionPieChartExpanded
              filter={todayFilter}
              getKey={(session) => ({
                key: session.category.name,
                metadata: { category: session.category },
              })}
              renderLegend={(props: {
                data: AmountByCategory<{
                  category: CategoryWithId;
                }>[];
              }) => {
                return (
                  <div className="flex flex-col items-start flex-grow w-full gap-1">
                    {props.data.map((val, i) => {
                      const context = useContext(ActiveIndexContext);

                      return (
                        <div
                          key={val.key}
                          onMouseEnter={() => context?.setIndex(i)}
                          onMouseLeave={() => context?.setIndex(null)}
                          className="flex items-center gap-2"
                        >
                          {val.metadata && (
                            <CategoryBadge
                              color={val.metadata.category.color}
                              name={val.metadata.category.name}
                            />
                          )}
                          <p>{formatTime(val.value)}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
        <Card className="col-span-full md:col-span-2">
          <CardHeader className="p-2">
            <h2 className="text-xl font-bold tracking-tight">
              Today&apos;s tags
            </h2>
          </CardHeader>
          <CardContent className="p-2">
            <SessionPieChartExpanded
              filter={todayFilter}
              getKey={(session) =>
                session.tags.length
                  ? session.tags.map((tag) => ({
                      key: tag.label,
                      metadata: { color: tag.color, name: tag.label },
                    }))
                  : {
                      key: "-",
                      metadata: { color: "#f129c1", name: "-" },
                    }
              }
              renderLegend={(props: {
                data: AmountByCategory<{
                  color: string;
                  name: string;
                }>[];
              }) => {
                return (
                  <div className="flex flex-col items-start flex-grow w-full gap-1">
                    {props.data.map((val, i) => {
                      const context = useContext(ActiveIndexContext);

                      return (
                        <div
                          key={val.key}
                          onMouseEnter={() => context?.setIndex(i)}
                          onMouseLeave={() => context?.setIndex(null)}
                          className="flex items-center gap-2"
                        >
                          {val.metadata && (
                            <TagBadge
                              variant="manual"
                              value={val.metadata.name}
                              colors={val.metadata.color}
                            />
                          )}
                          <p>{formatTime(val.value)}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
        <div className="col-span-2">
          <Feed />
        </div>
      </div>
    </div>
  );
}
type AdditionalProps = {
  renderLegend?: FC<{ data: AmountByCategory[] }>;
};

type ActiveIndexContextType = {
  index: number | null;
  setIndex: (value: number | null) => void;
};

export const ActiveIndexContext = createContext<
  ActiveIndexContextType | undefined
>(undefined);

const SessionPieChartExpanded2 = (
  props: SessionPieChartProps & AdditionalProps,
) => {
  // differenceInMinutes as default grouping method
  const groupingMethod =
    props.groupingMethod ??
    ((session: ScheduledSession) =>
      differenceInMinutes(session.endTime, session.startTime));

  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      return groupData(data, props.getKey, groupingMethod);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

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

export const SessionPieChartExpanded: FC<
  SessionPieChartProps & AdditionalProps
> = (props) => {
  const [filter, setFilter] = useState<number | null>(null);

  return (
    <ActiveIndexContext.Provider value={{ index: filter, setIndex: setFilter }}>
      <SessionPieChartExpanded2 {...props} />
    </ActiveIndexContext.Provider>
  );
};
