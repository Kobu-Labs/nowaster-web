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

export default function Page(props: { params: { detail: string } }) {
  const categoryId = props.params.detail;
  const query = useQuery({
    ...queryKeys.categories.byId(categoryId),
  });

  const updateCategoryColor = useUpdateCategory({});

  if (query.isLoading || query.isError || !query.data || query.data.isErr) {
    return <div className="m-8">Loading...</div>;
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
      categories: [query.data.value],
    },
  };

  return (
    <div className="grow">
      <div className="mt-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">
          Details page for
          <CategoryLabel category={query.data.value} />
          <ColorPicker
            initialColor={query.data.value.color}
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
