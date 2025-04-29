"use client";

import { SessionFilterPrecursor } from "@/state/chart-filter";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/charts/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/charts/SessionCountCard";
import { TagsToSessionPieChart } from "@/components/visualizers/charts/TagsToSessionPieChart";
import { TotalSessionTimeCard } from "@/components/visualizers/charts/TotalSessionTimeCard";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { useUpdateCategory } from "@/components/hooks/category/useUpdateCategory";
import { Skeleton } from "@/components/shadcn/skeleton";

export default function Page(props: { params: { detail: string } }) {
  const categoryId = props.params.detail;
  const query = useQuery({
    ...queryKeys.categories.byId(categoryId),
  });

  const updateCategoryColor = useUpdateCategory({});

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
        <FilteredSessionAreaChart
          initialGranularity="days-in-month"
          filter={filter}
          className="col-span-full h-[350px]"
        />
        <div className="col-span-full">
          <BaseSessionTable filter={filter} columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div>
  );
}
