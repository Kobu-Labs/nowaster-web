"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { CommonTagsPresenter } from "@/components/presenters/CommonTagsPresenter";
import { AverageDurationProvider } from "@/components/providers/AverageDurationProvider";
import { BaseSessionTableColumns } from "@/components/providers/session-table/BaseColumns";
import { BaseSessionTable } from "@/components/providers/session-table/BaseSessionTable";
import { SessionCountKpiCardProvider } from "@/components/providers/SessionCountKpiCardProvider";
import { TotalTimeKpiCardProvider } from "@/components/providers/TotalTimeKpiCardProvider";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";
import { FilteredAreaChart } from "@/stories/FilteredAreaChart/FilteredAreaChart";
import { Settings } from "lucide-react";
import { useRecoilState } from "recoil";
import { categoryColors } from "@/state/categories";
import { Card } from "@/components/ui/card";
import { FC } from "react";
import { randomColor } from "@/lib/utils";

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
  const category = props.params.detail;

  return (
    <div>
      <div className="mt-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">Details page for
          <CategoryLabel label={category} />
          <Popover >
            <PopoverTrigger asChild className="cursor-pointer">
              <Settings />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CategoryColorPicker category={category} />
            </PopoverContent>
          </Popover>
        </h2>
      </div>
      <div className="m-8 grid grid-cols-4 gap-8">
        <SessionCountKpiCardProvider filter={{ category: category }} />
        <TotalTimeKpiCardProvider filter={{ category: category }} />
        <AverageDurationProvider filter={{ category: category }} />
        <CommonTagsPresenter
          filter={{ category: category }}
        />
        <div className="col-span-full">
          <FilteredAreaChart
            initialGranularity="perDayInMonth"
            filter={{ category: category }}
          />
        </div>
        <div className="col-span-full">
          <BaseSessionTable
            filter={{ category: category }}
            columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div >
  );

}
