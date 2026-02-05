"use client";

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
} from "@/components/shadcn/sidebar";
import { usePathname } from "next/navigation";
import type { ProjectWithTaskCount } from "@/api/definitions/models/project";
import { Badge } from "@/components/shadcn/badge";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { createContext, useContext, useState, type FC } from "react";
import { useTasksByProject } from "@/components/hooks/project";
import { Button } from "@/components/shadcn/button";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

type ProjectSidebarProps = {
  projects: ProjectWithTaskCount[];
};

type SidebarContextType = {
  project: ProjectWithTaskCount | null;
  setProject: (val: ProjectWithTaskCount | null) => void;
};

export const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
}

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] =
    useState<null | ProjectWithTaskCount>(null);

  return (
    <SidebarContext.Provider
      value={{
        setProject: setSelectedProject,
        project: selectedProject,
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
          <div className="w-1/2 h-full shrink-0">
            <ProjectsSidebarContent
              projects={projects}
              onSelectProject={context.setProject}
            />
          </div>

          <div className="w-1/2 h-full shrink-0">
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
  ProjectSidebarProps & { onSelectProject: (val: ProjectWithTaskCount) => void }
> = ({ projects, onSelectProject }) => {
  const pathname = usePathname();
  return (
    <>
      <SidebarHeader className="p-4">
        <h2 className="font-semibold text-lg">All Projects</h2>
        <p className="text-xs text-muted-foreground">{projects.length} total</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="my-2">
          <SidebarGroupLabel>Projets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <Link href={`/home/projects/${project.id}`} key={project.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      onClick={() => onSelectProject(project)}
                    >
                      <div key={project.id}>
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
                              <Badge className="text-xs" variant="outline">
                                {project.taskCount} tasks
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>
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

const TasksSidebarContent: FC<{ projectId: string }> = (props) => {
  const project = useTasksByProject(props.projectId);
  const context = useSidebarContext();
  if (!project.data || project.isPending) {
    return null;
  }
  return (
    <>
      <SidebarHeader className="p-4">
        <Button onClick={() => context.setProject(null)}>Projects</Button>
      </SidebarHeader>

      <SidebarContent>
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
                            ></Badge>
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
