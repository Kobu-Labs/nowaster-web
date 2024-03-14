"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { HexColorPicker } from "react-colorful";
import { useRecoilState } from "recoil";
import { Card } from "@/components/shadcn/card";
import { FC, useState } from "react";
import { cn, randomColor } from "@/lib/utils";
import { SessionCountCard } from "@/components/visualizers/charts/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/charts/TotalSessionTimeCard";
import { SessionAverageDurationProvider } from "@/components/visualizers/charts/SessionAverageDurationCard";
import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { tagColors } from "@/state/tags";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";

type TagColorPickerProps = {
  tag: string
}

const TagColorPicker: FC<TagColorPickerProps> = (props) => {
  const [colors, setColors] = useRecoilState(tagColors);

  // colors[props.category] should be always defined at this point
  const currentCategoryColors = colors[props.tag] ?? randomColor();

  const setColorsGlobState = (value: string) => {
    const { [props.tag]: currentCategory, ...rest } = colors;
    setColors({ ...rest, [props.tag]: value });
  };

  return (
    <Card>
      <HexColorPicker color={currentCategoryColors} onChange={setColorsGlobState} />
    </Card>
  );
};

export default function Page() {
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const filter = {
    tags: selectedTag
  };
  const test = useQuery({
    ...queryKeys.tags.all
  });

  if (!test || !test.data) {
    return <div></div>;
  }

  if (!test.data.isOk) {
    return <div></div>;
  }

  return (
    <div className="m-10">
      <div className="grid w-full grid-cols-10 gap-3 align-middle">
        <Card className="col-span-1 flex w-min flex-col pt-2">
          {
            test.data.value.map(tag => (
              <div
                className={cn(
                  "flex w-full cursor-pointer rounded-lg px-4 py-1 hover:bg-accent hover:text-accent-foreground",
                  selectedTag === tag.label && "bg-accent",
                )}
                key={tag.id}
                onClick={() => setSelectedTag(tag.label)}
              >
                <TagBadge value={tag.label} />
              </div>
            ))
          }
        </Card>
        <Tabs defaultValue="general" className="col-span-9">
          <TabsList className="p-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="grid grid-cols-3 gap-4">
            <div className="col-span-1" >
              <TotalSessionTimeCard filter={filter} />
            </div>
            <div className="col-span-1" >
              <SessionAverageDurationProvider filter={filter} />
            </div>
            <div className="col-span-1" >
              <SessionCountCard filter={filter} />
            </div>
            <div className="col-span-full">
              <FilteredSessionAreaChart
                filter={filter}
                initialGranularity={"perDayInWeek"}
              />
            </div>

            <div className="col-span-full">
              <BaseSessionTable
                columns={BaseSessionTableColumns}
                filter={filter}
              />
            </div>
          </TabsContent>
          <TabsContent value="settings">
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );

}
