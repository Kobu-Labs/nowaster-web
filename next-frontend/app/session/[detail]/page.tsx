"use client";

import { FC } from "react";
import { categoryColors } from "@/state/categories";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { Settings } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useRecoilState } from "recoil";

import { randomColor } from "@/lib/utils";
import { Card } from "@/components/shadcn/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
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

type CategoryColorPickerProps = {
  category: string;
};

const CategoryColorPicker: FC<CategoryColorPickerProps> = (props) => {
  const [colors, setColors] = useRecoilState(categoryColors);

  // colors[props.category] should be always defined at this point
  const currentCategoryColors = colors[props.category] ?? randomColor();

  const setColorsGlobState = (value: string) => {
    setColors({ ...colors, [props.category]: value });
  };

  return (
    <Card>
      <HexColorPicker
        color={currentCategoryColors}
        onChange={setColorsGlobState}
      />
    </Card>
  );
};

export default function Page(props: { params: { detail: string } }) {
  const categoryName = props.params.detail;
  const query = useQuery({
    ...queryKeys.categories.byId(categoryName),
  });

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
          <Popover>
            <PopoverTrigger asChild className="cursor-pointer">
              <Settings />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CategoryColorPicker category={query.data.value.name} />
            </PopoverContent>
          </Popover>
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
