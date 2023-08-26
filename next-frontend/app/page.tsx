"use client"

import { Overview } from "@/components/overview-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HistoryCard } from "@/stories/HistoryCard/HistoryCard"
import { DateTime } from "luxon"
import { PlusSquare } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScheduledSessionApi } from "@/api"

type Granularity = "today" | "week" | "month" | "year"
export default function IndexPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions", "slider"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions({ limit: 10 }),
  });

  const [granularity, setGranularity] = useState<Granularity>("year")

  if (isLoading || isError ) {
    return <div >Something bad happenned</div>
  }

  if (data.isErr){
    return <div>{data.error.message}</div>
  }

  console.log(data.value)

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="my-8 flex gap-6">
        {data.value.length === 0
          ? <Button className="h-[120px] grow" variant="outline">
            <div className="flex flex-col items-center gap-2">
              <strong>No session yet</strong>
              <PlusSquare />
            </div>
          </Button>
          : data.value.map((session) => (
              <HistoryCard session={session} />

          ))
        }
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Past Activity Overview</CardTitle>
              <Select onValueChange={(a: Granularity) => { setGranularity(a) }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="year">Past year</SelectItem>
                    <SelectItem value="month">Past month</SelectItem>
                    <SelectItem value="week">Past week</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview granularity={granularity} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
