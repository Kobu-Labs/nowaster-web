"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { HexColorPicker } from "react-colorful";
import { Settings } from "lucide-react";
import { useRecoilState } from "recoil";
import { categoryColors } from "@/state/categories";
import { Card } from "@/components/shadcn/card";
import { FC } from "react";
import { randomColor } from "@/lib/utils";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { SessionCountCard } from "@/components/visualizers/charts/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/charts/TotalSessionTimeCard";
import { SessionAverageDurationProvider } from "@/components/visualizers/charts/SessionAverageDurationCard";
import { TagsToSessionPieChart } from "@/components/visualizers/charts/TagsToSessionPieChart";
import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";

type CategoryColorPickerProps = {
  category: string
}

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
      <HexColorPicker color={currentCategoryColors} onChange={setColorsGlobState} />
    </Card>
  );

};

export default function Page(props: { params: { detail: string } }) {
  const categoryName = props.params.detail;
  const filter = { category: { name: categoryName } };

  return (
    <div>
      <div className="mt-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">Details page for
          <CategoryLabel label={categoryName} />
          <Popover >
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
        <TagsToSessionPieChart
          filter={filter}
        />
        <div className="col-span-full">
          <FilteredSessionAreaChart
            initialGranularity="perDayInMonth"
            filter={filter}
          />
        </div>
        <div className="col-span-full">
          <BaseSessionTable
            filter={filter}
            columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div >
  );

}
