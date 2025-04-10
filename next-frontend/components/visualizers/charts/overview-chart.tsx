"use client";

import { useState } from "react";
import { ScheduledSession } from "@/api/definitions";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addSeconds,
  differenceInMinutes,
  format,
  getDate,
  getDay,
  getDaysInMonth,
  getMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

export const Granularity = {
  week: "Past week",
  month: "Past month",
  year: "Past year",
} as const;

const dateProcessors: {
  [K in keyof typeof Granularity]: {
    amount: () => number
    key: (value: Date) => string
    start: Date
    next: (value: Date) => Date
  }
} = {
  week: {
    start: startOfWeek(Date.now()),
    next: (value) => addDays(value, 1),
    amount: () => 7,
    key: (value: Date) => (1 + getDay(value)).toString(),
  },
  month: {
    start: startOfMonth(Date.now()),
    next: (value) => addDays(value, 1),
    amount: () => getDaysInMonth(Date.now()),
    key: (value: Date) => getDate(value).toString(),
  },
  year: {
    start: startOfYear(Date.now()),
    next: (value) => addMonths(value, 1),
    amount: () => 12,
    key: (value: Date) => (getMonth(value) + 1).toString(),
  },
};

type OverviewProps = {
  granularity: keyof typeof Granularity
}

const preprocessData = (
  granularity: keyof typeof Granularity,
  data: (ScheduledSession & { id: string })[],
): { granularity: string; val: number }[] => {
  const processor = dateProcessors[granularity];
  const processed = data.reduce((value: { [month: string]: number }, item) => {
    const key = processor.key(item.endTime);
    if (!value[key]) {
      value[key] = 0;
    }

    value[key] += differenceInMinutes(item.endTime, item.startTime);
    return value;
  }, {});

  let i = 0;
  let current = processor.start;
  while (i < processor.amount()) {
    i++;
    if (!processed[processor.key(current)]) {
      processed[processor.key(current)] = 0;
    }
    current = processor.next(current);
  }

  return Object.entries(processed).map((value) => {
    return { granularity: value[0], val: value[1] };
  });
};

export function Overview(props: OverviewProps) {
  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.sessions.filtered(),
  });
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(
    props.granularity,
  );

  if (!sessions || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (sessions.isErr) {
    return <div>{sessions.error.message}</div>;
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Past Activity Overview</CardTitle>
          <Select
            onValueChange={(a: keyof typeof Granularity) => {
              setGranularity(a);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={Granularity[granularity]} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup defaultChecked>
                {/* TODO: minor UX issue: currently selected item doesnt have its checkmakr */}
                {Object.entries(Granularity).map(([k, v]) => (
                  <SelectItem key={k} disabled={k === granularity} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      {/* FIX: harcoded height should not be used here */}
      <CardContent className="ml-2 h-[234px] w-full">
        <ResponsiveContainer>
          <BarChart data={preprocessData(granularity, sessions.value)}>
            <XAxis
              dataKey="granularity"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                format(addSeconds(new Date(0), value * 60), "hh:mm:ss")
              }
            />
            <Bar dataKey="val" fill="#e879f9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
