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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/shadcn/sidebar";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { prefetchProjectDetails } from "@/lib/prefetch/prefetchProjectDetails";
import { prefetchProjectTasks } from "@/lib/prefetch/prefetchProjectTasks";
import { cn } from "@/lib/utils";
import { CheckCircle2, Folders, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type FC, useContext, useMemo, useState } from "react";

type ProjectSidebarProps = {
  projects: ProjectWithTaskCount[];
};

type SidebarContextType = {
  project: null | ProjectWithTaskCount;
  setProject: (val: null | ProjectWithTaskCount) => void;
};

export const SidebarContext = createContext<null | SidebarContextType>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
}

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject]
    = useState<null | ProjectWithTaskCount>(null);

  return (
    <SidebarContext.Provider
      value={{
        project: selectedProject,
        setProject: setSelectedProject,
      }}
    >
      <ProjectSidebarInner projects={projects} />
    </SidebarContext.Provider>
  );
};

export const ProjectSidebarInner: FC<ProjectSidebarProps> = ({ projects }) => {
  const context = useSidebarContext();

  const showingTasks = context.project !== null;

  return (
    <Sidebar
      className="w-64 border-r bg-transparent overflow-hidden h-full"
      collapsible="none"
      variant="sidebar"
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className={cn(
            "flex h-full w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            showingTasks ? "-translate-x-1/2" : "translate-x-0",
          )}
        >
          <div className="w-1/2 h-full shrink-0 flex flex-col">
            <ProjectsSidebarContent
              onSelectProject={context.setProject}
              projects={projects}
            />
          </div>

          <div className="w-1/2 h-full shrink-0 flex flex-col">
            {context.project && (
              <TasksSidebarContent projectId={context.project.id} />
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
    <>
      <SidebarContent>
        <SidebarGroup>
          <Link className="w-full" href="/home/projects">
            <Button
              asChild
              className="w-full flex items-center justify-start gap-2 py-1 m-0"
              variant="secondary"
            >
              <div>
                <Folders className="size-4" />
                Project Dashboard
              </div>
            </Button>
          </Link>
        </SidebarGroup>
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
      <SidebarRail />
    </>
  );
};

const TasksSidebarContent: FC<{ projectId: string; }> = (props) => {
  const project = useTasksByProject(props.projectId);
  const context = useSidebarContext();
  if (!project.data || project.isPending) {
    return null;
  }
  return (
    <>
      <SidebarHeader className="p-4 flex-shrink-0">
        <Button onClick={() => context.setProject(null)}>Projects</Button>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto flex-1">
        <SidebarGroup className="my-2">
          <SidebarGroupLabel>Projets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {project.data.map((project) => (
                <SidebarMenuItem key={project.name}>
                  <SidebarMenuButton asChild>
                    <div key={project.id}>
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {project.name}
                            </p>
                            {project.completed && (
                              <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className="text-xs"
                              variant="outline"
                            >
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </>
  );
};
