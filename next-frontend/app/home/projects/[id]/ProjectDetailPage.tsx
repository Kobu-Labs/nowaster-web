"use client";

import type { TaskWithSessionCount } from "@/api/definitions/models/task";
import { useProjectById } from "@/components/hooks/project/useProjectById";
import { useTasksWithSessionCountByProject } from "@/components/hooks/task/useTasksWithSessionCountByProject";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { EditProjectDialog } from "@/components/visualizers/projects/EditProjectDialog";
import { ProjectDetailHeader } from "@/components/visualizers/projects/ProjectDetailHeader";
import { ProjectTasksKpiCard } from "@/components/visualizers/sessions/kpi/project/ProjectTasksKpiCard";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { CreateTaskDialog } from "@/components/visualizers/tasks/CreateTaskDialog";
import { EditTaskDialog } from "@/components/visualizers/tasks/EditTaskDialog";
import { TaskList } from "@/components/visualizers/tasks/TaskList";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { ListTodo } from "lucide-react";
import type { FC } from "react";
import { useMemo, useState } from "react";

type ProjectDetailPageProps = {
  projectId: string;
};

const ProjectDetailPage: FC<ProjectDetailPageProps> = ({ projectId }) => {
  const [editingProject, setEditingProject] = useState(false);
  const [editingTask, setEditingTask] = useState<null | TaskWithSessionCount>(
    null,
  );

  const projectQuery = useProjectById(projectId);
  const tasksQuery = useTasksWithSessionCountByProject(projectId);

  // Create filter for sessions associated with this project (via tasks)
  const sessionFilter: SessionFilterPrecursor = useMemo(
    () => ({
      data: {
        tasks: tasksQuery.data,
      },
      settings: {
        tasks: {
          id: {
            mode: "all",
          },
        },
      },
    }),
    [tasksQuery.data],
  );

  if (projectQuery.isPending || tasksQuery.isPending) {
    return (
      <div className="w-full p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="w-full p-6">
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

  if (tasksQuery.isError) {
    return (
      <div className="w-full p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Tasks
            </CardTitle>
            <CardDescription>
              There was an error loading tasks for this project. Please try
              refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full p-6">
      <div className="flex-1 space-y-6 min-w-0">
        <ProjectDetailHeader project={projectQuery.data} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProjectTasksKpiCard projectId={projectId} />
          <TotalSessionTimeCard filter={sessionFilter} />
          <SessionCountCard filter={sessionFilter} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
              <p className="text-muted-foreground">
                Manage tasks for this project
              </p>
            </div>
            <CreateTaskDialog projectId={projectId} />
          </div>

          {tasksQuery.data.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <ListTodo className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No tasks yet</h3>
                    <p className="text-muted-foreground">
                      Create your first task to start tracking work on this
                      project.
                    </p>
                  </div>
                  <CreateTaskDialog projectId={projectId} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <TaskList
              onEditTask={setEditingTask}
              projectColor={projectQuery.data.color}
              tasks={tasksQuery.data}
            />
          )}
        </div>

        <EditProjectDialog
          onOpenChange={(open) => !open && setEditingProject(false)}
          open={editingProject}
          project={projectQuery.data}
        />

        <EditTaskDialog
          onOpenChange={(open) => !open && setEditingTask(null)}
          open={!!editingTask}
          task={editingTask}
        />
      </div>
    </div>
  );
};

export default ProjectDetailPage;
