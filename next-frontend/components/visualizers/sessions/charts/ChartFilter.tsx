import { CategoryWithId, TagDetails } from "@/api/definitions";
import {
  changeCategoryFilterMode,
  changeTagFilterMode,
  defaultFilter,
  handleSelectCategory,
  overwriteData,
} from "@/state/chart-filter";
import { CircleHelp, Filter, RotateCcw } from "lucide-react";
import { FC, useMemo } from "react";

import { useChartFilter } from "@/components/hooks/use-chart-filter";
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
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { cn, countLeaves, translateFilterPrecursor } from "@/lib/utils";

export const ChartFilter: FC = () => {
  const { filter, setFilter } = useChartFilter();

  const onSelectTag = (tags: TagDetails[]) =>
    setFilter((state) => overwriteData(state, { tags }));

  const onSelectCategory = (category: CategoryWithId) =>
    setFilter((state) => handleSelectCategory(state, category));

  const resetFilter = () => setFilter(defaultFilter);

  const appliedFiltersCount = useMemo(
    () => countLeaves(translateFilterPrecursor(filter)),
    [filter],
  );

  return (
    <div className="flex flex-col">
      <Sheet modal={false}>
        <SheetTrigger asChild className="group relative cursor-pointer">
          <Button
            variant="outline"
            className="flex items-center justify-center overflow-visible w-fit"
          >
            <Filter className="group-hover:text-pink-300 ">Open</Filter>
            {appliedFiltersCount > 0 && (
              <div
                className={cn(
                  "absolute right-[10%] top-[-20%] animate-blink text-shadow-neon-pink group-hover:text-pink-300",
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

            <SimpleTagPicker
              modal={false}
              onNewTagsSelected={onSelectTag}
              selectedTags={filter.data.tags ?? []}
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setFilter((state) => changeTagFilterMode(state, value));
              }}
              defaultValue={filter.settings.tags?.label?.mode}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center  gap-2">
                <RadioGroupItem value="all" id="category-exact" />
                <Label htmlFor="category-exact">Superset matching</Label>
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Each session will contain all of these tags</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center  gap-2">
                <RadioGroupItem value="some" id="category-some" />
                <Label htmlFor="category-some">Subset matching</Label>
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Each session will contain at least one of these tags
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <SheetDescription>Filter by categories</SheetDescription>
            <CategoryPicker
              selectedCategories={filter.data.categories ?? []}
              onSelectCategory={onSelectCategory}
              mode="multiple"
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setFilter((state) => changeCategoryFilterMode(state, value));
              }}
              defaultValue={filter.settings.categories?.name?.mode}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center  gap-2">
                <RadioGroupItem value="all" id="category-exact" />
                <Label htmlFor="category-exact">Exact match</Label>
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Each session will have this category</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="some" id="category-some" />
                <Label htmlFor="category-some">
                  &rdquo;One of&rdquo; match
                </Label>
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Each session will have one of these categories</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
