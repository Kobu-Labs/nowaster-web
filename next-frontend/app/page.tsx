"use client";

import { useQuery } from "@tanstack/react-query";
import { AlignVerticalDistributeEnd, Calendar, Hourglass } from "lucide-react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
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
    return <div>Something bad happenned</div>;
  }

  return (
    <div className="flex grow flex-col p-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex gap-8 ">
        <KpiCardUiProvider
          value={stats.data.value.session_count}
          title={"Total Sessions"}
          description={"Many to go.."}
        >
          <AlignVerticalDistributeEnd />
        </KpiCardUiProvider>
        <KpiCardUiProvider
          value={stats.data.value.minutes}
          title={"Total Minutes Spent"}
          description={`That's almost ${Math.ceil(
            stats.data.value.minutes / 60
          )} hours!`}
        >
          <Hourglass />{" "}
        </KpiCardUiProvider>
        <KpiCardUiProvider
          value={stats.data.value.streak}
          title={"Current Streak"}
          description={"Keep it going!"}
        >
          {" "}
          <Calendar />
        </KpiCardUiProvider>
      </div>
      <div className="mt-8 grid grow gap-8 md:grid-cols-2 lg:grid-cols-7">
        <FilteredSessionAreaChart
          initialGranularity="days-in-month"
          className="col-span-full"
        />
      </div>
    </div>
  );
}
