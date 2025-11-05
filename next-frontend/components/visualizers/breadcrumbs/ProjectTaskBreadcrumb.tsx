"use client";

import type { ProjectWithTaskCount } from "@/api/definitions/models/project";
import { useProjectsWithTaskCount } from "@/components/hooks/project/useProjectsWithTaskCount";
import { useTasksWithSessionCountByProject } from "@/components/hooks/task/useTasksWithSessionCountByProject";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcn/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { prefetchProjectDetails } from "@/lib/prefetch/prefetchProjectDetails";
import { prefetchProjectTasks } from "@/lib/prefetch/prefetchProjectTasks";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, Circle, Folders } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FC } from "react";
import { useMemo } from "react";

export const ProjectTaskBreadcrumb: FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Parse the pathname to extract projectId and taskId
  const { projectId, taskId } = useMemo(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    // Expected patterns:
    // /home/projects -> []
    // /home/projects/[projectId] -> [projectId]
    // /home/projects/[projectId]/tasks/[taskId] -> [projectId, taskId]

    const projectsIndex = pathParts.indexOf("projects");
    if (projectsIndex === -1)
    { return { projectId: undefined, taskId: undefined }; }

    const projectId = pathParts[projectsIndex + 1];
    const tasksIndex = pathParts.indexOf("tasks");
    const taskId = tasksIndex === -1 ? undefined : pathParts[tasksIndex + 1];

    return { projectId, taskId };
  }, [pathname]);

  const projectsQuery = useProjectsWithTaskCount();
  const tasksQuery = useTasksWithSessionCountByProject(projectId ?? null);

  const currentProject = projectsQuery.data?.find((p) => p.id === projectId);
  const currentTask = tasksQuery.data?.find((t) => t.id === taskId);

  const handleProjectSelect = (project: ProjectWithTaskCount) => {
    router.push(`/home/projects/${project.id}`);
  };

  const handleTaskSelect = (task_id: string) => {
    router.push(`/home/projects/${projectId}/tasks/${task_id}`);
  };

  const shortenTaskName = (name: string, maxLength = 25) => {
    if (name.length <= maxLength) { return name; }
    return `${name.slice(0, Math.max(0, maxLength))}...`;
  };

  const prefetch = (projectId: string) => {
    prefetchProjectTasks(projectId);
    prefetchProjectDetails(projectId);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link className="flex items-center gap-1.5" href="/home/projects">
              <Folders className="h-4 w-4" />
              Projects
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {projectId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {currentProject
                ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <ProjectAvatar
                          color={currentProject.color}
                          imageUrl={currentProject.image_url}
                          name={currentProject.name}
                          size={16}
                        />
                        <span
                          className={cn(
                            currentProject.completed
                            && "line-through text-muted-foreground",
                          )}
                        >
                          {currentProject.name}
                        </span>
                        {currentProject.completed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        )}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {projectsQuery.data?.map((project) => (
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            key={project.id}
                            onClick={() => handleProjectSelect(project)}
                            onMouseEnter={() => prefetch(project.id)}
                          >
                            <ProjectAvatar
                              color={project.color}
                              imageUrl={project.image_url}
                              name={project.name}
                              size={20}
                            />
                            <span
                              className={cn(
                                "flex-1",
                                project.completed
                                && "line-through text-muted-foreground",
                              )}
                            >
                              {project.name}
                            </span>
                            {project.completed && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            )}
                            {project.id === projectId && !project.completed && (
                              <span className="text-xs text-muted-foreground">
                                Current
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                : (
                    <BreadcrumbPage>Loading...</BreadcrumbPage>
                  )}
            </BreadcrumbItem>
          </>
        )}

        {taskId && currentTask && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  {currentTask.completed
                    ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      )
                    : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                  <span
                    className={cn(
                      currentTask.completed
                      && "line-through text-muted-foreground",
                    )}
                  >
                    {shortenTaskName(currentTask.name)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {tasksQuery.data?.map((task) => (
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      key={task.id}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      {task.completed
                        ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          )
                        : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                      <span
                        className={cn(
                          "flex-1",
                          task.completed
                          && "line-through text-muted-foreground",
                        )}
                      >
                        {task.name}
                      </span>
                      {task.id === taskId && !task.completed && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Current
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
