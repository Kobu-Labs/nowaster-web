"use client";

import { AlignVerticalDistributeEnd, Calendar, Hourglass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { Overview } from "@/components/visualizers/charts/overview-chart";
import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";

export default function IndexPage() {

  const stats = useQuery({
    ...queryKeys.statistics.dashboard,
    retry: false,
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
        <KpiCardUiProvider value={stats.data.value.session_count} title={"Total Sessions"} description={"Many to go.."}><AlignVerticalDistributeEnd /></KpiCardUiProvider>
        <KpiCardUiProvider value={stats.data.value.minutes} title={"Total Minutes Spent"} description={`That's almost ${Math.ceil(stats.data.value.minutes / 60)} hours!`}><Hourglass /> </KpiCardUiProvider>
        <KpiCardUiProvider value={stats.data.value.streak} title={"Current Streak"} description={"Keep it going!"}> <Calendar /></KpiCardUiProvider>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Overview granularity="month" />
        <div className="col-span-4">
          <FilteredSessionAreaChart
            initialGranularity="perDayInMonth"
          />
        </div>
      </div>
    </div>
  );
}
