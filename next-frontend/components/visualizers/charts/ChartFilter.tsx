import { FC, useContext, useState } from "react";
import {
  ScheduledSessionRequest,
  TagWithId,
} from "@kobu-labs/nowaster-js-typing";
import { Filter, RotateCcw } from "lucide-react";

import { cn, countLeaves } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Separator } from "@/components/shadcn/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SessionFilterContext } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { StatelessTagPicker } from "@/components/visualizers/tags/TagPicker";

type ChartFilterProps = {};

type FilterStrategy = Partial<{
  category: keyof NonNullable<
    NonNullable<ScheduledSessionRequest["readMany"]["category"]>["label"]
  >;
  tags: keyof NonNullable<
    NonNullable<ScheduledSessionRequest["readMany"]["tags"]>["label"]
  >;
}>;

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

  const fStrat: FilterStrategy = {};

  if (filter.category?.label?.some) {
    fStrat.category = "some";
  }
  if (filter.category?.label?.exact) {
    fStrat.category = "exact";
  }
  if (filter.tags?.label?.some) {
    fStrat.tags = "some";
  }
  if (filter.tags?.label?.every) {
    fStrat.tags = "every";
  }

  const [filterStrategy, setFilterStrategy] = useState<
    FilterStrategy | undefined
  >(fStrat);

  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([]);
  const updateTagsFilter = (tags: string[]) => {
    const { tags: oldTags, ...rest } = filter;
    if (filterStrategy?.tags === undefined) {
      setFilterStrategy({ tags: "some" });
    }

    setFilter({
      tags: {
        label: {
          [filterStrategy?.tags || "some"]: tags,
        },
      },
      ...rest,
    });
  };

  const updateCategoryFilter = (categories: string[]) => {
    const { category: oldCategories, ...rest } = filter;
    if (filterStrategy?.category === undefined) {
      setFilterStrategy({ category: "some" });
    }

    setFilter({
      category: {
        label: {
          [filterStrategy?.category || "some"]: categories,
        },
      },
      ...rest,
    });
  };

  // TODO: this should be refactored
  const onSelectTag = (tag: TagWithId) => {
    const t = filter.tags?.label?.some ?? filter.tags?.label?.every;
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

  const updateTagFilterStrategy = (strategy: FilterStrategy["tags"]) => {
    if (filterStrategy === undefined) {
      setFilterStrategy({ tags: strategy });
    } else {
      const { tags: oldTags, ...rest } = filterStrategy;
      setFilterStrategy({ tags: strategy, ...rest });
    }

    const { tags, ...rest2 } = filter;
    setFilter({
      tags: {
        label: {
          [strategy ?? "some"]: selectedTags.map((tag) => tag.label),
        },
      },
      ...rest2,
    });
  };

  const updateCategoryFilterStrategy = (
    strategy: FilterStrategy["category"]
  ) => {
    if (filterStrategy === undefined) {
      setFilterStrategy({ category: strategy });
    } else {
      const { category, ...rest } = filterStrategy;
      setFilterStrategy({ category: strategy, ...rest });
    }

    const { category, ...rest2 } = filter;
    setFilter({
      category: {
        label: {
          [strategy ?? "some"]: selectedCategories,
        },
      },
      ...rest2,
    });
  };

  // TODO: this is sooo bad - state is duplicated in filter and in this
  const onSelectCategory = (category: string) => {
    const c = filter.category?.label?.some ?? filter?.category?.label?.exact;
    if (c === undefined) {
      updateCategoryFilter([category]);
    } else if (filter.category?.label?.some !== undefined) {
      let newCategories;
      if (selectedCategories.some((t) => t === category)) {
        // deselect
        newCategories = selectedCategories.filter((t) => t !== category);
      } else {
        // select
        newCategories = [category, ...selectedCategories];
      }
      if (
        filter.category?.label?.some.findIndex((cat) => cat === category) === -1
      ) {
        updateCategoryFilter([category, ...selectedCategories]);
      } else {
        updateCategoryFilter(
          selectedCategories.filter((cat) => cat !== category)
        );
      }
      setSelectedCategories(newCategories);
    } else if (filter.category?.label?.exact !== undefined) {
      if (filter.category?.label?.exact === category) {
        updateCategoryFilter([]);
        setSelectedCategories([]);
      } else {
        updateCategoryFilter([category]);
        setSelectedCategories([category]);
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
            <SheetDescription>Filter by tags</SheetDescription>

            <StatelessTagPicker
              modal={false}
              onSelectTag={onSelectTag}
              selectedTags={selectedTags}
            />
            <RadioGroup
              onValueChange={(v: NonNullable<FilterStrategy["tags"]>) =>
                updateTagFilterStrategy(v)
              }
              defaultValue={filterStrategy?.tags}
              className="flex flex-col space-y-1"
            >
              <TooltipProvider delayDuration={350}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center  gap-2">
                      <RadioGroupItem value="every" id="category-exact" />
                      <Label htmlFor="category-exact">Superset matching</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtered sessions will contain all of these tags</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={350}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center  gap-2">
                      <RadioGroupItem value="some" id="category-some" />
                      <Label htmlFor="category-some">Subset matching</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtered sessions will contain a subset of these tags</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </RadioGroup>
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <SheetDescription>Filter by categories</SheetDescription>
            <MultipleCategoryPicker
              selectedCategories={selectedCategories}
              onSelectCategory={onSelectCategory}
            />
            <RadioGroup
              defaultValue={filterStrategy?.category}
              onValueChange={(v: NonNullable<FilterStrategy["category"]>) =>
                updateCategoryFilterStrategy(v)
              }
              className="flex flex-col space-y-1"
            >
              <TooltipProvider delayDuration={350}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center  gap-2">
                      <RadioGroupItem value="exact" id="category-exact" />
                      <Label htmlFor="category-exact">Exact match</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtered sessions will have exactly this category</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={350}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center  gap-2">
                      <RadioGroupItem value="some" id="category-some" />
                      <Label htmlFor="category-some">"One of" match</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtered sessions will have one of these categories</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </RadioGroup>
            <Separator className="my-2" />
          </div>
          <Button variant="destructive" className="w-min" onClick={resetFilter}>
            <RotateCcw />
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
};
