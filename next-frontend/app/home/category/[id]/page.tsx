"use client";

import { useUpdateCategory } from "@/components/hooks/category/useUpdateCategory";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useIsMobile } from "@/components/shadcn/use-mobile";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { TagsToSessionPieChart } from "@/components/visualizers/sessions/charts/TagsToSessionPieChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/sessions/kpi/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

export default function Page(props: { params: Promise<{ id: string; }>; }) {
  const { id: categoryId } = use(props.params);
  const query = useQuery({
    ...queryKeys.categories.byId(categoryId),
  });

  const updateCategoryColor = useUpdateCategory();
  const isMobile = useIsMobile();

  if (query.isPending) {
    return (
      <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
        <h2 className="text-3xl font-bold tracking-tight">Details page for</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video col-span-2 md:col-span-1" />
          <Skeleton className="aspect-video col-span-2 md:col-span-1" />
          <Skeleton className="col-span-full h-[300px] md:h-[350px]" />
          <Skeleton className="col-span-full h-[300px] md:h-[350px]" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <Skeleton className="flex w-full items-center justify-center h-10 grow" />
    );
  }

  const filter: SessionFilterPrecursor = {
    data: {
      categories: [query.data],
    },
    settings: {
      categories: {
        name: {
          mode: "all",
        },
      },
    },
  };

  return (
    <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
      <span className="inline-flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight">
        <span className="text-nowrap">Details page for</span>
        <CategoryLabel category={query.data} />
        <ColorPicker
          initialColor={query.data.color}
          onSelect={(color) =>
            updateCategoryColor.mutate({
              color,
              id: categoryId,
            })}
        />
      </span>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8">
        <SessionCountCard filter={filter} />
        <TotalSessionTimeCard filter={filter} />
        <SessionAverageDurationProvider filter={filter} />
        <div className="col-span-full">
          <TagsToSessionPieChart
            filter={filter}
            legendPosition={isMobile ? "bottom" : "right"}
            renderLegend
          />
        </div>
        <FilterContextProvider initialFilter={filter}>
          <FilteredSessionAreaChart
            className="col-span-full h-[300px] md:h-[400px]"
            initialGranularity="days-in-month"
          />
        </FilterContextProvider>
        <div className="col-span-full">
          <BaseSessionTable columns={BaseSessionTableColumns} filter={filter} />
        </div>
      </div>
    </div>
  );
}
