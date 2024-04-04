import { FC } from "react";
import {
  changeCategoryFilterMode,
  changeTagFilterMode,
  enrichedChartFilterSate,
  handleSelectCategory,
  handleSelectTag,
  resetFilterFull,
} from "@/state/chart-filter";
import { TagWithId } from "@kobu-labs/nowaster-js-typing";
import { useAtom } from "jotai";
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
import { StatelessTagPicker } from "@/components/visualizers/tags/TagPicker";

type ChartFilterProps = {};

// TODO: currently the most disgusting component in the codebase
// refactor it using Forms probably
export const ChartFilter: FC<ChartFilterProps> = () => {
  const [filter, setChartFilter] = useAtom(enrichedChartFilterSate);

  const onSelectTag = (tag: TagWithId) =>
    setChartFilter((state) => handleSelectTag(state, tag));

  const onSelectCategory = (category: string) =>
    setChartFilter((state) => handleSelectCategory(state, { name: category }));

  const resetFilter = () => setChartFilter(resetFilterFull());

  const appliedFiltersCount = countLeaves(filter.filter);

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
              selectedTags={filter.data.tags}
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setChartFilter((state) =>
                  changeTagFilterMode(state, value)
                );
              }}
              defaultValue={filter.filter.categories?.name?.mode}
              className="flex flex-col space-y-1"
            >
              <TooltipProvider delayDuration={350}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center  gap-2">
                      <RadioGroupItem  value="all" id="category-exact" />
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
              selectedCategories={filter.data.categories.map((c) => c.name)}
              onSelectCategory={onSelectCategory}
            />
            <RadioGroup
              onValueChange={(value: "some" | "all") => {
                setChartFilter((state) => changeTagFilterMode(state, value));
              }}
              defaultValue={filter.filter.tags?.label?.mode}
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
                      <Label htmlFor="category-some">
                        &rdquo;One of&rdquo; match
                      </Label>
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
