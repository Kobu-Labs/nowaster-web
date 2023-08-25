"use client"

import { ScheduledSessionApi } from "@/api"
import { ScheduledSession } from "@/validation/models"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

type Granularity = "today" | "week" | "month" | "year"
type OverviewProps = {
  granularity: Granularity
}

const preprocessData = (data: (ScheduledSession & { id: string })[]): { month: string, minutes: number }[] => {
  return data.map(e => {
    const month = e.endTime.toLocaleString("default", { month: "short" })
    const minutes = (e.endTime.getTime() - e.startTime.getTime()) / 60 / 60
    return { month, minutes }
  })
}

export function Overview(props: OverviewProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(),
  });

  const [granularity, setGranularity] = useState<Granularity>("year")

  if (isLoading || isError) {
    return <div >Something bad happenned</div>
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>
  }
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={preprocessData(data.value)}>
        <XAxis
          dataKey="month"
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
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="minutes" fill="#e879f9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
