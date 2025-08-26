"use client";

import { useUpdateCategory } from "@/components/hooks/category/useUpdateCategory";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
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
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

export default function Page(props: { params: Promise<{ id: string }> }) {
  const { id: categoryId } = use(props.params);
  const query = useQuery({
    ...queryKeys.categories.byId(categoryId),
  });

  const updateCategoryColor = useUpdateCategory();

  if (query.isPending) {
    return (
      <div className="grow">
        <div className="mt-8 pl-8 ">
          <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">
            Details page for
          </h2>
        </div>
        <div className="m-8 grid grid-cols-4 gap-8">
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="col-span-full h-[350px]" />
          <Skeleton className="col-span-full h-[350px]" />
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
    settings: {
      categories: {
        name: {
          mode: "all",
        },
      },
    },
    data: {
      categories: [query.data],
    },
  };

  return (
    <div className="grow">
      <div className="mt-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">
          Details page for
          <CategoryLabel category={query.data} />
          <ColorPicker
            initialColor={query.data.color}
            onSelect={(color) =>
              updateCategoryColor.mutate({
                id: categoryId,
                color: color,
              })
            }
          />
        </h2>
      </div>
      <div className="m-8 grid grid-cols-4 gap-8">
        <SessionCountCard filter={filter} />
        <TotalSessionTimeCard filter={filter} />
        <SessionAverageDurationProvider filter={filter} />
        <TagsToSessionPieChart filter={filter} />
        <FilterContextProvider initialFilter={filter}>
          <FilteredSessionAreaChart
            initialGranularity="days-in-month"
            className="col-span-full h-[350px]"
          />
        </FilterContextProvider>
        <div className="col-span-full">
          <BaseSessionTable filter={filter} columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div>
  );
}
