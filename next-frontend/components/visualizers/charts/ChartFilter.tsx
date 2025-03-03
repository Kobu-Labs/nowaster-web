import { FC } from "react";
import {
  changeCategoryFilterMode,
  changeTagFilterMode,
  filterPrecursorAtom,
  handleSelectCategory,
  handleSelectTag,
  getDefaultFilter,
} from "@/state/chart-filter";
import { TagWithId } from "@/api/definitions";
import { useAtom } from "jotai";
import { CircleHelp, Filter, RotateCcw } from "lucide-react";

import { cn, countLeaves, translateFilterPrecursor } from "@/lib/utils";
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
import { StatelessTagPicker } from "@/components/visualizers/tags/TagPicker";

// TODO: empty props right now
type ChartFilterProps = Record<string, never>;

// TODO: currently the most disgusting component in the codebase
// refactor it using Forms probably
export const ChartFilter: FC<ChartFilterProps> = () => {
  const [filter, setChartFilter] = useAtom(filterPrecursorAtom);

  const onSelectTag = (tag: TagWithId) =>
    setChartFilter((state) => handleSelectTag(state, tag));

  const onSelectCategory = (category: string) =>
    setChartFilter((state) => handleSelectCategory(state, { name: category }));

  const resetFilter = () => setChartFilter(getDefaultFilter());

  // TODO: memoize this
  const appliedFiltersCount = countLeaves(translateFilterPrecursor(filter));

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

            <StatelessTagPicker
              modal={false}
              onSelectTag={onSelectTag}
              selectedTags={filter.data.tags ?? []}
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setChartFilter((state) => changeTagFilterMode(state, value));
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
                      <p>Filtered sessions will contain all of these tags</p>
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
                        Filtered sessions will contain a subset of these tags
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
            <MultipleCategoryPicker
              selectedCategories={
                filter.data.categories?.map((c) => c.name) ?? []
              }
              onSelectCategory={onSelectCategory}
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setChartFilter((state) =>
                  changeCategoryFilterMode(state, value),
                );
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
                      <p>Filtered sessions will have exactly this category</p>
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
                      <p>Filtered sessions will have one of these categories</p>
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
