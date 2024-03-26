"use client";

import { FC, useState } from "react";
import { tagColors } from "@/state/tags";
import {
  ScheduledSessionRequest,
  TagWithId,
} from "@kobu-labs/nowaster-js-typing";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useRecoilState } from "recoil";

import { cn, randomColor } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/charts/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/charts/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/charts/TotalSessionTimeCard";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
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
      <HexColorPicker
        color={currentCategoryColors}
        onChange={setColorsGlobState}
      />
    </Card>
  );
};

const SettingsTab: FC<{ tag: TagWithId }> = (props) => {
  const categories = useQuery({
    ...queryKeys.categories.all,
  });
  if (!categories || !categories.data) {
    return <div></div>;
  }
  if (!categories.data.isOk) {
    return <div></div>;
  }

  return (
    <div>
      <div>
        Allowed Categories:
        {props.tag.allowedCategories.map((cat) => (
          <CategoryLabel label={cat.name} key={cat.name} />
        ))}
      </div>
      <div>
        All Categories:
        {categories.data.value.map((cat) => (
          <div className="flex gap-1">
            <Button size="nosize" variant="outline">
              <Plus />
            </Button>
            <CategoryLabel label={cat.name} key={cat.name} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Page() {
  const [selectedTag, setSelectedTag] = useState<TagWithId | undefined>();

  let filter: ScheduledSessionRequest["readMany"] = {};

  // TODO check what happends when `some` is initialized as [undefined]
  if (selectedTag?.label) {
    filter = {
      tags: {
        label: {
          some: [selectedTag.label],
        },
      },
    };
  }

  const test = useQuery({
    ...queryKeys.tags.all,
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
          {test.data.value.map((tag) => (
            <div
              className={cn(
                "flex w-full cursor-pointer rounded-lg px-4 py-1 hover:bg-accent hover:text-accent-foreground",
                selectedTag?.label === tag.label && "bg-accent"
              )}
              key={tag.id}
              onClick={() => setSelectedTag({ ...tag })}
            >
              <TagBadge value={tag.label} />
            </div>
          ))}
        </Card>
        {selectedTag && (
          <Tabs defaultValue="general" className="col-span-9">
            <TabsList className="p-1">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="grid grid-cols-3 gap-4">
              <TotalSessionTimeCard filter={filter} />
              <SessionAverageDurationProvider filter={filter} />
              <SessionCountCard filter={filter} />
              <FilteredSessionAreaChart
                filter={filter}
                initialGranularity={"perDayInWeek"}
                className="col-span-full h-[350px]"
              />
              <div className="col-span-full">
                <BaseSessionTable
                  columns={BaseSessionTableColumns}
                  filter={filter}
                />
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab tag={selectedTag} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
