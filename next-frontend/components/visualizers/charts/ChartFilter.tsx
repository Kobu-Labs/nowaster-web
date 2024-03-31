import { FC, useContext, useState } from "react";
import { TagWithId } from "@kobu-labs/nowaster-js-typing";
import { SessionFilterContext } from "components/visualizers/charts/FilteredSessionAreaChart";
import { Filter, RotateCcw } from "lucide-react";

import { cn, countLeaves } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet";
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { StatelessTagPicker } from "@/components/visualizers/tags/TagPicker";

type ChartFilterProps = {};

// TODO: currently the most disgusting component in the codebase
// refactor it using Forms probably
export const ChartFilter: FC<ChartFilterProps> = () => {
  const context = useContext(SessionFilterContext);
  if (context === undefined) {
    throw new Error("Context must be set");
  }

  const { filter, setFilter } = context;
  let selectedCatFromContext: string[] = [];
  if (filter.category?.label?.some) {
    selectedCatFromContext = filter.category?.label?.some;
  } else if (filter.category?.label?.exact) {
    selectedCatFromContext = [filter.category?.label?.exact];
  }

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    selectedCatFromContext
  );

  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([]);
  const updateTagsFilter = (tags: string[]) => {
    const { tags: oldTags, ...rest } = filter;
    setFilter({
      tags: {
        label: {
          some: tags,
        },
      },
      ...rest,
    });
  };

  const updateCategoryFilter = (categories: string[]) => {
    const { category: oldCategories, ...rest } = filter;
    setFilter({
      category: {
        label: {
          some: categories,
        },
      },
      ...rest,
    });
  };

  // TODO: this should be refactored
  const onSelectTag = (tag: TagWithId) => {
    const t = filter.tags?.label?.some;
    if (t === undefined) {
      updateTagsFilter([tag.label]);
    } else {
      if (t.includes(tag.label)) {
        updateTagsFilter(t.filter((s) => s !== tag.label));
      } else {
        updateTagsFilter([tag.label, ...t]);
      }
    }

    // TODO: this is sooo bad - state is duplicated in filter and in this
    if (selectedTags.findIndex((v) => v.id === tag.id) === -1) {
      setSelectedTags([tag, ...selectedTags]);
    } else {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
    }
  };

  // TODO: this is sooo bad - state is duplicated in filter and in this
  const onSelectCategory = (category: string) => {
    let newCategories;
    if (selectedCategories.some((t) => t === category)) {
      // deselect
      newCategories = selectedCategories.filter((t) => t !== category);
    } else {
      // select
      newCategories = [category, ...selectedCategories];
    }
    setSelectedCategories(newCategories);

    const c = filter.category?.label?.some;
    if (c === undefined) {
      updateCategoryFilter([category]);
    } else {
      if (c.findIndex((cat) => cat === category) === -1) {
        updateCategoryFilter([category, ...selectedCategories]);
      } else {
        updateCategoryFilter(
          selectedCategories.filter((cat) => cat !== category)
        );
      }
    }
  };

  const resetFilter = () => {
    setFilter({});
    setSelectedTags([]);
    setSelectedCategories([]);
  };

  const appliedFiltersCount = countLeaves(filter);

  return (
    <div className="flex flex-col">
      <Sheet modal={false}>
        <SheetTrigger asChild className="group relative  cursor-pointer">
          <Button
            variant="outline"
            className="flex items-center justify-center"
          >
            <Filter className="group-hover:text-pink-300 ">Open</Filter>
            {appliedFiltersCount > 0 && (
              <div
                className={cn(
                  "absolute right-[10%] top-[-20%] animate-blink text-shadow-neon-pink group-hover:text-pink-300"
                )}
              >
                {appliedFiltersCount}
              </div>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Apply filter</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            <SheetDescription>
              Filter all sessions that contain at least one of the following
              tags
            </SheetDescription>
            <StatelessTagPicker
              modal={false}
              onSelectTag={onSelectTag}
              selectedTags={selectedTags}
            />
          </div>
          <div className="flex flex-col gap-1">
            <SheetDescription>
              Filter all sessions that contain at least one of the following
              categories
            </SheetDescription>
            <MultipleCategoryPicker
              selectedCategories={selectedCategories}
              onSelectCategory={onSelectCategory}
            />
          </div>
          <Button variant="destructive" className="w-min" onClick={resetFilter}>
            <RotateCcw />
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
};
