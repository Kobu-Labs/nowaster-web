import type {
  CategoryWithId,
  ProjectWithId,
  TagDetails,
  TaskWithId,
} from "@/api/definitions";
import {
  changeCategoryFilterMode,
  changeTagFilterMode,
  changeTaskFilterMode,
  defaultFilter,
  handleSelectCategory,
  handleSelectTask,
  overwriteData,
} from "@/state/chart-filter";
import { ChartPie, Filter, Folders, Tag as TagIcon, X } from "lucide-react";
import type { FC } from "react";
import { useMemo } from "react";

import { useChartFilter } from "@/components/hooks/use-chart-filter";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { ProjectPicker } from "@/components/visualizers/projects/ProjectPicker";
import { TaskPicker } from "@/components/visualizers/tasks/TaskPicker";
import { TaskBadge } from "@/components/visualizers/tasks/TaskBadge";
import { cn, countLeaves, translateFilterPrecursor } from "@/lib/utils";

type MatchMode = "all" | "some";

type MatchModeToggleProps = {
  itemLabel: string;
  mode?: MatchMode;
  onChange: (mode: MatchMode) => void;
};

// Same all/any wording for tags, categories and tasks so the concept
// only has to be learned once.
const MatchModeToggle: FC<MatchModeToggleProps> = ({
  itemLabel,
  mode = "some",
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>
        Sessions must have
      </span>
      <div className="inline-flex rounded-md border border-border p-0.5">
        <button
          className={cn(
            "rounded-sm px-2 py-0.5 transition-colors",
            mode === "all"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent/50",
          )}
          onClick={() => onChange("all")}
          type="button"
        >
          all
        </button>
        <button
          className={cn(
            "rounded-sm px-2 py-0.5 transition-colors",
            mode === "some"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent/50",
          )}
          onClick={() => onChange("some")}
          type="button"
        >
          any
        </button>
      </div>
      <span>
        of the selected
        {" "}
        {itemLabel}
      </span>
    </div>
  );
};

const SectionHeader: FC<{
  count: number;
  icon: FC<{ className?: string; }>;
  title: string;
}> = ({ count, icon: Icon, title }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="text-sm font-medium">{title}</span>
    {count > 0 && (
      <Badge className="h-5 px-1.5" variant="secondary">
        {count}
      </Badge>
    )}
  </div>
);

export const ChartFilter: FC = () => {
  const { filter, setFilter } = useChartFilter();

  const onSelectTag = (tags: TagDetails[]) => {
    setFilter((state) => overwriteData(state, { tags }));
  };

  const onSelectCategory = (category: CategoryWithId) => {
    setFilter((state) => handleSelectCategory(state, category));
  };

  const onSelectProject = (project: null | ProjectWithId) => {
    setFilter((state) => overwriteData(state, { project }));
  };

  const onSelectTask = (task: null | TaskWithId) => {
    if (task) {
      setFilter((state) => handleSelectTask(state, task));
    }
  };

  const onRemoveTask = (taskId: string) => {
    setFilter((state) => ({
      ...state,
      data: {
        ...state.data,
        tasks: state.data.tasks?.filter((t) => t.id !== taskId),
      },
    }));
  };

  const resetFilter = () => {
    setFilter(defaultFilter);
  };

  const appliedFiltersCount = useMemo(
    () => countLeaves(translateFilterPrecursor(filter)),
    [filter],
  );

  const tagCount = filter.data.tags?.length ?? 0;
  const categoryCount = filter.data.categories?.length ?? 0;
  const taskCount = filter.data.tasks?.length ?? 0;

  return (
    <div className="flex flex-col">
      <Sheet modal={false}>
        <SheetTrigger asChild>
          <Button className="gap-2" variant="outline">
            <Filter className="h-4 w-4" />
            Filters
            {appliedFiltersCount > 0 && (
              <Badge className="h-5 px-1.5" variant="secondary">
                {appliedFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col gap-0 p-0">
          <SheetHeader className="gap-1">
            <SheetTitle>Filters</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Show only sessions that match what you pick below.
            </p>
          </SheetHeader>
          <Separator />

          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {/* Tags */}
            <div className="flex flex-col gap-2">
              <SectionHeader count={tagCount} icon={TagIcon} title="Tags" />
              <SimpleTagPicker
                modal={false}
                onNewTagsSelected={onSelectTag}
                selectedTags={filter.data.tags ?? []}
              />
              {tagCount > 1 && (
                <MatchModeToggle
                  itemLabel="tags"
                  mode={filter.settings.tags?.label?.mode}
                  onChange={(mode) => {
                    setFilter((state) => changeTagFilterMode(state, mode));
                  }}
                />
              )}
            </div>

            <Separator />

            {/* Categories */}
            <div className="flex flex-col gap-2">
              <SectionHeader
                count={categoryCount}
                icon={ChartPie}
                title="Categories"
              />
              <CategoryPicker
                mode="multiple"
                onSelectCategory={onSelectCategory}
                selectedCategories={filter.data.categories ?? []}
              />
              {categoryCount > 1 && (
                <MatchModeToggle
                  itemLabel="categories"
                  mode={filter.settings.categories?.name?.mode}
                  onChange={(mode) => {
                    setFilter((state) =>
                      changeCategoryFilterMode(state, mode));
                  }}
                />
              )}
            </div>

            <Separator />

            {/* Tasks */}
            <div className="flex flex-col gap-2">
              <SectionHeader count={taskCount} icon={Folders} title="Tasks" />

              {filter.data.tasks && filter.data.tasks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filter.data.tasks.map((task) => (
                    <div className="flex items-center gap-1" key={task.id}>
                      <TaskBadge
                        completed={task.completed}
                        name={task.name}
                        skipStrikethrough
                      />
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => onRemoveTask(task.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Project
                </Label>
                <ProjectPicker
                  onSelectProject={onSelectProject}
                  selectedProjectId={filter.data.project?.id ?? null}
                  skipStrikethrough
                />
              </div>

              {filter.data.project && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Add task
                  </Label>
                  <TaskPicker
                    onSelectTask={onSelectTask}
                    projectId={filter.data.project.id}
                    selectedTaskId={null}
                    skipStrikethrough
                  />
                </div>
              )}

              {taskCount > 1 && (
                <MatchModeToggle
                  itemLabel="tasks"
                  mode={filter.settings.tasks?.id?.mode}
                  onChange={(mode) => {
                    setFilter((state) => changeTaskFilterMode(state, mode));
                  }}
                />
              )}
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {appliedFiltersCount === 0
                ? "No filters applied"
                : `${appliedFiltersCount} filter${appliedFiltersCount === 1 ? "" : "s"} applied`}
            </span>
            <Button
              disabled={appliedFiltersCount === 0}
              onClick={resetFilter}
              size="sm"
              variant="ghost"
            >
              Clear filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
