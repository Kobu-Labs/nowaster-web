"use client";

import { FC } from "react";
import { categoryColors } from "@/state/categories";
import { SessionFilter } from "@/state/chart-filter";
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

type CategoryColorPickerProps = {
  category: string;
};

const CategoryColorPicker: FC<CategoryColorPickerProps> = (props) => {
  const [colors, setColors] = useRecoilState(categoryColors);

  // colors[props.category] should be always defined at this point
  const currentCategoryColors = colors[props.category] ?? randomColor();

  const setColorsGlobState = (value: string) => {
    const { [props.category]: currentCategory, ...rest } = colors;
    setColors({ ...rest, [props.category]: value });
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
  const filter: Partial<SessionFilter> = {
    categories: { name: { mode: "all", value: [categoryName] } },
  };

  return (
    <div className="grow">
      <div className="mt-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">
          Details page for
          <CategoryLabel label={categoryName} />
          <Popover>
            <PopoverTrigger asChild className="cursor-pointer">
              <Settings />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CategoryColorPicker category={categoryName} />
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
          initialGranularity="perDayInMonth"
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
