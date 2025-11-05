"use client";

import { useProjectById } from "@/components/hooks/project/useProjectById";
import { useTaskById } from "@/components/hooks/task/useTaskById";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useIsMobile } from "@/components/shadcn/use-mobile";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { TagsToSessionPieChart } from "@/components/visualizers/sessions/charts/TagsToSessionPieChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/sessions/kpi/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { TaskDetailHeader } from "@/components/visualizers/tasks/TaskDetailHeader";
import { TaskDetailKpiCards } from "@/components/visualizers/tasks/TaskDetailKpiCards";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { use } from "react";

export default function TaskDetailPage(props: {
  params: Promise<{ id: string; taskId: string; }>;
}) {
  const { id: projectId, taskId } = use(props.params);
  const taskQuery = useTaskById(taskId);
  const projectQuery = useProjectById(projectId);
  const isMobile = useIsMobile();

  if (taskQuery.isPending || projectQuery.isPending) {
    return (
      <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="col-span-full h-[300px]" />
        <Skeleton className="col-span-full h-[400px]" />
      </div>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    return (
      <div className="flex grow flex-col p-4 md:p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Task</CardTitle>
            <CardDescription>
              The task could not be found or there was an error loading it.
              Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="flex grow flex-col p-4 md:p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Project</CardTitle>
            <CardDescription>
              The project could not be found or there was an error loading it.
              Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Create filter for sessions associated with this task
  const filter: SessionFilterPrecursor = {
    data: {
      tasks: [taskQuery.data],
    },
    settings: {
      tasks: {
        name: {
          mode: "all",
        },
      },
    },
  };

  return (
    <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
      <TaskDetailHeader project={projectQuery.data} task={taskQuery.data} />

      <TaskDetailKpiCards task={taskQuery.data} />

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8">
        <SessionCountCard filter={filter} />
        <TotalSessionTimeCard filter={filter} />
        <SessionAverageDurationProvider filter={filter} />

        <div className="col-span-full">
          <TagsToSessionPieChart
            filter={filter}
            legendPosition={isMobile ? "bottom" : "right"}
            renderLegend
          />
        </div>

        <FilterContextProvider initialFilter={filter}>
          <FilteredSessionAreaChart
            className="col-span-full h-[300px] md:h-[400px]"
            initialGranularity="days-in-month"
          />
        </FilterContextProvider>

        <div className="col-span-full">
          <BaseSessionTable columns={BaseSessionTableColumns} filter={filter} />
        </div>
      </div>
    </div>
  );
}
