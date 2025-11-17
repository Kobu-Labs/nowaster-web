"use client";

import { useProjectById } from "@/components/hooks/project/useProjectById";
import { useTaskById } from "@/components/hooks/task/useTaskById";
import { useUpdateTask } from "@/components/hooks/task/useUpdateTask";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { TagsToSessionPieChart } from "@/components/visualizers/sessions/charts/TagsToSessionPieChart";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { LogSessionDialog } from "@/components/visualizers/sessions/LogSessionDialog";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { EditTaskDialog } from "@/components/visualizers/tasks/EditTaskDialog";
import { cn } from "@/lib/utils";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  CheckCircle2,
  Circle,
  Edit2,
  Plus,
  Square,
  SquareCheckBig,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

export default function TaskDetailPage(props: {
  params: Promise<{ id: string; taskId: string; }>;
}) {
  const { id: projectId, taskId } = use(props.params);
  const taskQuery = useTaskById(taskId);
  const projectQuery = useProjectById(projectId);
  const updateTask = useUpdateTask();
  const [editingTask, setEditingTask] = useState(false);
  const [logSessionOpen, setLogSessionOpen] = useState(false);

  const handleToggleComplete = (completed: boolean) => {
    updateTask.mutate({
      completed,
      id: taskId,
    });
  };

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
            <CardTitle className="text-destructive">
              Error Loading Task
            </CardTitle>
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
            <CardTitle className="text-destructive">
              Error Loading Project
            </CardTitle>
            <CardDescription>
              The project could not be found or there was an error loading it.
              Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const task = taskQuery.data;
  const project = projectQuery.data;

  // Create filter for sessions associated with this task
  const filter: SessionFilterPrecursor = {
    data: {
      tasks: [task],
    },
    settings: {
      tasks: {
        id: {
          mode: "all",
        },
      },
    },
  };

  return (
    <>
      <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
        <Card className="group hover:gradient-card hover:transition-all duration-300 ease-in-out hover:border-pink-primary">
          <CardHeader className="flex flex-row justify-between">
            <Link
              className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
              href={`/home/projects/${project.id}`}
            >
              <ProjectBadge
                color={project.color}
                completed={project.completed}
                name={project.name}
              />
            </Link>
            <div className="flex gap-2">
              <Button onClick={() => setLogSessionOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Session
              </Button>
              <Button
                onClick={() => handleToggleComplete(!task.completed)}
                size="sm"
                variant="outline"
              >
                {task.completed
                  ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )
                  : (
                      <Circle className="h-4 w-4 mr-2" />
                    )}
                {task.completed ? "Mark as incomplete" : "Mark as completed"}
              </Button>
              <Button
                onClick={() => setEditingTask(true)}
                size="sm"
                variant="outline"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-start gap-3">
                  {task.completed
                    ? (
                        <SquareCheckBig className="size-8 text-green-600" />
                      )
                    : (
                        <Square className="h-4 w-4 text-green-600" />
                      )}
                  <h1
                    className={cn(
                      "text-3xl font-bold tracking-tight",
                      task.completed && "line-through",
                    )}
                  >
                    {task.name}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex-1">
              {task.description && (
                <p className="text-muted-foreground mt-2">{task.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <TotalSessionTimeCard filter={filter} />
          <SessionCountCard filter={filter} />
          <TagsToSessionPieChart filter={filter} />
          <FilterContextProvider initialFilter={filter}>
            <FilteredSessionAreaChart
              className="col-span-full h-[300px] md:h-[400px]"
              initialGranularity="days-in-month"
            />
          </FilterContextProvider>

          <div className="col-span-full">
            <BaseSessionTable
              columns={BaseSessionTableColumns}
              filter={filter}
            />
          </div>
        </div>
      </div>

      {task && (
        <EditTaskDialog
          onOpenChange={setEditingTask}
          open={editingTask}
          task={task}
        />
      )}

      <LogSessionDialog
        onOpenChange={setLogSessionOpen}
        open={logSessionOpen}
        precursor={{
          project: { id: project.id },
          task: { id: task.id },
        }}
        title={`Log Session for ${task.name}`}
      />
    </>
  );
}
