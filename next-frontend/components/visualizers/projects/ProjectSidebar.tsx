"use client";

import type { ProjectWithTaskCount } from "@/api/definitions/models/project";
import { useTasksByProject } from "@/components/hooks/project/useTasksByProject";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/shadcn/sidebar";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { prefetchProjectDetails } from "@/lib/prefetch/prefetchProjectDetails";
import { prefetchProjectTasks } from "@/lib/prefetch/prefetchProjectTasks";
import { prefetchTask } from "@/lib/prefetch/prefetchTask";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Folders,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, useMemo, useState } from "react";

type ProjectSidebarProps = {
  projects: ProjectWithTaskCount[];
};

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] =
    useState<null | ProjectWithTaskCount>(null);

  return (
    <Sidebar
      className="w-64 border-r bg-transparent h-screen overflow-auto"
      collapsible="none"
      variant="sidebar"
    >
      <div className="relative h-full w-full overflow-hidden">
        <SidebarHeader>
          <Button
            asChild
            className="w-full flex items-center justify-start gap-2 py-1 m-0"
            variant="secondary"
            onClick={() => setSelectedProject(null)}
          >
            <div>
              {selectedProject ? (
                <ChevronLeft className="size-4" />
              ) : (
                <Folders className="size-4" />
              )}
              Project Dashboard
            </div>
          </Button>
        </SidebarHeader>
        <div
          className={cn(
            "flex h-full w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            selectedProject ? "-translate-x-1/2" : "translate-x-0",
          )}
        >
          <div className="w-1/2 h-full shrink-0 flex flex-col">
            <ProjectsSidebarContent
              onSelectProject={setSelectedProject}
              projects={projects}
            />
          </div>

          <div className="w-1/2 h-full shrink-0 flex flex-col">
            {selectedProject && (
              <TasksSidebarContent projectId={selectedProject.id} />
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

const ProjectsSidebarContent: FC<
  { onSelectProject: (val: ProjectWithTaskCount) => void } & ProjectSidebarProps
> = ({ onSelectProject, projects }) => {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const prefetch = (projectId: string) => {
    prefetchProjectTasks(projectId);
    prefetchProjectDetails(projectId);
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [[searchTerm]],
  );

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Projets</SidebarGroupLabel>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            value={searchTerm}
          />
        </div>

        <SidebarSeparator className="my-2 mr-2 bg-pink-muted" />
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredProjects.map((project) => (
              <Link
                href={`/home/projects/${project.id}`}
                key={project.id}
                onMouseEnter={() => prefetch(project.id)}
              >
                <SidebarMenuItem>
                  <Button
                    asChild
                    className="w-full flex items-center justify-start  h-14"
                    onClick={() => onSelectProject(project)}
                    variant="secondary"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer",
                        pathname === project.id && "bg-accent",
                      )}
                    >
                      <ProjectAvatar
                        color={project.color}
                        imageUrl={project.image_url}
                        name={project.name}
                        size={32}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {project.name}
                          </p>
                          {project.completed && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 my-1">
                          <Badge className="text-xs" variant="outline">
                            {project.taskCount} tasks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                </SidebarMenuItem>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};

const TasksSidebarContent: FC<{ projectId: string }> = (props) => {
  const tasks = useTasksByProject(props.projectId);

  if (!tasks.data || tasks.isPending) {
    // TODO: show spinners
    return null;
  }

  return (
    <SidebarContent className="overflow-y-auto flex-1">
      <SidebarGroup className="my-2">
        <SidebarGroupLabel>Tasks</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {tasks.data.map((task) => (
              <Link
                href={`/home/projects/${props.projectId}/tasks/${task.id}`}
                key={task.name}
                onMouseEnter={() => prefetchTask(task.id)}
              >
                <SidebarMenuItem>
                  <Button
                    asChild
                    className="w-full flex items-center justify-start "
                    variant="outline"
                  >
                    <div key={task.id} className="min-w-0 w-full">
                      <div
                        className={cn(
                          "flex items-center gap-2 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer min-w-0 w-full",
                        )}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-medium truncate min-w-0 flex-1",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.name}
                        </span>
                        <Badge
                          className="text-xs flex-shrink-0"
                          variant="outline"
                        >
                          {task.sessionCount}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                </SidebarMenuItem>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};
