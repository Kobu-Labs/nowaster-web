"use client";

import { useProjectById } from "@/components/hooks/project/useProjectById";
import { useTaskById } from "@/components/hooks/task/useTaskById";
import { useUpdateTask } from "@/components/hooks/task/useUpdateTask";
import { Skeleton } from "@/components/shadcn/skeleton";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { use, useState } from "react";
import { TagsToSessionPieChart } from "@/components/visualizers/sessions/charts/TagsToSessionPieChart";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { LogSessionDialog } from "@/components/visualizers/sessions/LogSessionDialog";
import { EditTaskDialog } from "@/components/visualizers/tasks/EditTaskDialog";
import { CheckCircle2, Circle, Plus, Edit2 } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import Link from "next/link";

export default function TaskDetailPage(props: {
  params: Promise<{ id: string; taskId: string }>;
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
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 space-y-4">
                <Link
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  href={`/home/projects/${project.id}`}
                >
                  <ProjectAvatar
                    color={project.color}
                    imageUrl={project.image_url}
                    name={project.name}
                    size={20}
                  />
                  <span>{project.name}</span>
                </Link>

                <div className="flex items-start gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <Circle className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {task.name}
                    </h1>
                    {task.description && (
                      <p className="text-muted-foreground mt-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      task.completed ? "bg-green-600 hover:bg-green-700" : ""
                    }
                    variant={task.completed ? "default" : "secondary"}
                  >
                    {task.completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </div>

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
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
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
