import { ScheduledSession } from "@/validation/models";
import { useQuery } from "@tanstack/react-query";
import { addDays, addMonths, differenceInMinutes, endOfMonth, endOfWeek, endOfYear, getDate, getDay, getDaysInMonth, getMonth, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { useState } from "react";
import { Result } from "@badrap/result";
import { OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";


export type Granularity = "week" | "month" | "year"

const dateProcessors: {
  [K in Granularity]: {
    amount: number,
    key: (value: Date) => string,
    start: Date,
    end: Date,
    next: (value: Date) => Date,
  }
} = {
  week: {
    start: startOfWeek(Date.now()),
    next: value => addDays(value, 1),
    end: endOfWeek(Date.now()),
    amount: 7,
    key: (value: Date) => (1 + getDay(value)).toString()
  },
  month: {
    start: startOfMonth(Date.now()),
    next: value => addDays(value, 1),
    end: endOfMonth(Date.now()),
    amount: getDaysInMonth(Date.now()),
    key: (value: Date) => getDate(value).toString()
  },
  year: {
    start: startOfYear(Date.now()),
    next: value => addMonths(value, 1),
    end: endOfYear(Date.now()),
    amount: 12,
    key: (value: Date) => (getMonth(value) + 1).toString()
  }
} as const;

type SessionsByCategory = { [category: string]: string } & { granularity: string }

const preprocessData = (processor: typeof dateProcessors[keyof typeof dateProcessors], data: (ScheduledSession)[]): SessionsByCategory[] => {
  let processed = data.reduce((value: { [granularity: string]: { [category: string]: number } }, item) => {
    const key = processor.key(item.endTime);
    if (!value[key]) {
      value[key] = {};
    }
    if (!value[key]![item.category]) {
      value[key]![item.category] = 0;
    }

    value[key]![item.category] += differenceInMinutes(item.endTime, item.startTime);
    return value;
  }, {});


  return Object.entries(processed).map(([k, v]) => {
    return { granularity: k, ...v };
  });
};


type OverviewChartProps<T> = {
  granularity: Granularity,
  queryFn: (data: { toDate?: Date, fromDate?: Date }) => Promise<Result<T[]>>,
  queryKey: string[],
}


export const OverviewAreaChartProvider = <T extends ScheduledSession>(props: OverviewChartProps<T>) => {
  const [granularity, setGranularity] = useState<Granularity>(props.granularity);
  const processor = dateProcessors[granularity];

  const { data, isLoading, isError } = useQuery({
    /* BUG: cannot use dynamic query keys or the chart starts to flicker on rerenders */
    queryKey: ["sessions", "area-chart", processor.start, processor.end],
    retry: false,
    queryFn: async () => await props.queryFn({ fromDate: processor.start, toDate: processor.end }),
    staleTime: 1000 * 60 * 60,
  });


  if (isLoading || isError) {
    return <div >Something bad happenned</div>;
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>;
  }
  const processed = preprocessData(processor, data.value);
  const uniqueCategories = Array.from(new Set(data.value.map(x => x.category)));

  const colors: { [category: string]: string } = {};
  uniqueCategories.forEach((category) => colors[category] = "#" + Math.floor(Math.random() * 16777215).toString(16));

  return (
    <OverviewAreaChartVisualizer
      granularity={granularity}
      data={processed}
      categories={uniqueCategories}
      ticks={Array.from({ length: processor.amount }, (_, i) => i + 1)}
      amount={processor.amount}
      setGranularity={setGranularity} />
  );
};
