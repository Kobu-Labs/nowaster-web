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
import { CreateProjectDialog } from "@/components/visualizers/projects/CreateProjectDialog";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import { CreateTaskDialog } from "@/components/visualizers/tasks/CreateTaskDialog";
import { TaskBadge } from "@/components/visualizers/tasks/TaskBadge";
import { prefetchProjectDetails } from "@/lib/prefetch/prefetchProjectDetails";
import { prefetchProjectTasks } from "@/lib/prefetch/prefetchProjectTasks";
import { prefetchTask } from "@/lib/prefetch/prefetchTask";
import { cn } from "@/lib/utils";
import { Calendar, ChevronLeft, Clock, Folders, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

type ProjectSidebarProps = {
  projects: ProjectWithTaskCount[];
};

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject]
    = useState<null | ProjectWithTaskCount>(null);

  return (
    <Sidebar
      className="w-64 border-r bg-transparent h-screen overflow-auto"
      collapsible="none"
      variant="sidebar"
    >
      <div className="relative h-full w-full overflow-hidden">
        <SidebarHeader className="space-y-2">
          <Button
            asChild
            className="w-full flex items-center justify-start gap-2 py-1 m-0"
            onClick={() => setSelectedProject(null)}
            variant="secondary"
          >
            <div>
              {selectedProject
                ? (
                    <ChevronLeft className="size-4" />
                  )
                : (
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
              <TasksSidebarContent project={selectedProject} />
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

const ProjectsSidebarContent: FC<
  { onSelectProject: (val: ProjectWithTaskCount) => void; } & ProjectSidebarProps
> = ({ onSelectProject, projects }) => {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const prefetch = (projectId: string) => {
    void prefetchProjectTasks(projectId);
    void prefetchProjectDetails(projectId);
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
      <CreateProjectDialog />
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
                      <div className="flex items-center gap-2">
                        <ProjectAvatar
                          color={project.color}
                          imageUrl={project.image_url}
                          name={project.name}
                          size={35}
                        />
                        <div className="flex flex-col gap-1">
                          <ProjectBadge
                            color={project.color}
                            completed={project.completed}
                            name={project.name}
                          />
                          <Badge className="text-xs w-fit" variant="outline">
                            {project.taskCount}
                            {" "}
                            tasks
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

const TasksSidebarContent: FC<{ project: ProjectWithTaskCount; }> = ({
  project,
}) => {
  const tasks = useTasksByProject(project.id);

  if (!tasks.data || tasks.isPending) {
    // TODO: show spinners
    return null;
  }

  return (
    <SidebarContent className="overflow-y-auto flex-1">
      <div className="flex flex-col items-start gap-3 my-6 px-4">
        <div className="flex items-center gap-2">
          <ProjectAvatar
            color={project.color}
            imageUrl={project.image_url}
            name={project.name}
          />
          <ProjectBadge
            color={project.color}
            completed={project.completed}
            name={project.name}
            size="lg"
            skipStrikethrough
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>
              Created
              {" "}
              {format(project.created_at, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>
              Updated
              {" "}
              {formatDistanceToNow(project.updated_at, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>Tasks</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <CreateTaskDialog projectId={project.id} />
            {tasks.data.map((task) => (
              <Link
                href={`/home/projects/${project.id}/tasks/${task.id}`}
                key={task.name}
                onMouseEnter={() => prefetchTask(task.id)}
              >
                <SidebarMenuItem>
                  <Button
                    asChild
                    className="w-full flex items-center justify-start "
                    variant="outline"
                  >
                    <div className="min-w-0 w-full" key={task.id}>
                      <div
                        className={cn(
                          "flex items-center gap-2 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer min-w-0 w-full",
                        )}
                      >
                        <TaskBadge
                          completed={task.completed}
                          name={task.name}
                        />
                        <Badge
                          className="text-xs flex-shrink-0 ml-auto"
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
