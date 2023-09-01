"use client"

import { ScheduledSessionApi } from "@/api"
import { ScheduledSession } from "@/validation/models"
import { useQuery } from "@tanstack/react-query"
import { addDays, addMonths, addSeconds, differenceInMinutes, format, getDate, getDay, getDaysInMonth, getMonth, startOfMonth, startOfWeek, startOfYear } from "date-fns"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export type Granularity = "week" | "month" | "year"

const dateProcessors: {
  [K in Granularity]: {
    amount: () => number,
    key: (value: Date) => string,
    start: Date,
    next: (value: Date) => Date,
  }
} = {
  week: {
    start: startOfWeek(Date.now()),
    next: value => addDays(value, 1),
    amount: () => 7,
    key: (value: Date) => (1 + getDay(value)).toString()
  },
  month: {
    start: startOfMonth(Date.now()),
    next: value => addDays(value, 1),
    amount: () => getDaysInMonth(Date.now()),
    key: (value: Date) => getDate(value).toString()
  },
  year: {
    start: startOfYear(Date.now()),
    next: value => addMonths(value, 1),
    amount: () => 12,
    key: (value: Date) => (getMonth(value) + 1).toString()
  }
}

type OverviewProps = {
  granularity: Granularity,
}

const preprocessData = (granularity: Granularity, data: (ScheduledSession & { id: string })[]): { granularity: string, val: number }[] => {
  const processor = dateProcessors[granularity]
  let processed = data.reduce((value: { [month: string]: number }, item) => {
    const key = processor.key(item.endTime)
    if (!value[key]) {
      value[key] = 0
    }

    value[key] += differenceInMinutes(item.endTime, item.startTime)
    return value
  }, {})


  let i = 0;
  let current = processor.start
  while (i < processor.amount()) {
    i++;
    if (!processed[processor.key(current)]) {
      processed[processor.key(current)] = 0
    }
    current = processor.next(current)
  }

  return Object.entries(processed).map(value => {
    return { granularity: value[0], val: value[1] }
  })
}

export function Overview(props: OverviewProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(),
  });

  if (isLoading || isError) {
    return <div >Something bad happenned</div>
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>
  }
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={preprocessData(props.granularity, data.value)}>
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
          tickFormatter={(value: number) => format(addSeconds(new Date(0), value * 60), "hh:mm:ss")}
        />
        <Bar dataKey="val" fill="#e879f9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
