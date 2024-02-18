"use client";

import { Overview } from "@/components/overview-chart";
import { AlignVerticalDistributeEnd, Calendar, Hourglass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsApi } from "@/api";
import { ClampedSessionAreaChart } from "@/components/ClampedSessionAreaChart";
import { KpiCardVisualizer } from "@/components/visualizers/KpiCardVisualizer";

export default function IndexPage() {

  const stats = useQuery({
    queryKey: ["statistics", "dashboard"],
    retry: false,
    queryFn: async () => await StatisticsApi.getDashboardData(),
  });


  if (!stats.data || stats.isLoading || stats.isError) {
    return <div>Something bad happenned</div>;
  }

  if (stats.data.isErr) {
    return <div>{stats.data.error.message}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex gap-8 ">
        <KpiCardVisualizer value={stats.data.value.session_count.toString()} title={"Total Sessions"} description={"Many to go.."}><AlignVerticalDistributeEnd /></KpiCardVisualizer>
        <KpiCardVisualizer value={stats.data.value.minutes.toString()} title={"Total Minutes Spent"} description={`That's almost ${Math.ceil(stats.data.value.minutes / 60)} hours!`}><Hourglass /> </KpiCardVisualizer>
        <KpiCardVisualizer value={stats.data.value.streak.toString()} title={"Current Streak"} description={"Keep it going!"}> <Calendar /></KpiCardVisualizer>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Overview granularity="month" />
        <div className="col-span-4">
          <ClampedSessionAreaChart
            initialGranularity="week"
          />
        </div>
      </div>
    </div>
  );
}
