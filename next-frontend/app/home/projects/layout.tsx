"use client";
import { useProjectsWithTaskCount } from "@/components/hooks/project";
import { ProjectTaskBreadcrumb } from "@/components/visualizers/breadcrumbs/ProjectTaskBreadcrumb";
import { ProjectSidebar } from "@/components/visualizers/projects/ProjectSidebar";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ReleasesLayout({ children }: Props) {
  const project = useProjectsWithTaskCount();
  if (!project.data) {
    return;
  }
  return (
    <div className="min-h-screen w-full h-full flex items-start">
      <ProjectSidebar projects={project.data} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="pl-4 py-4 border-b border-pink-muted w-full">
          <ProjectTaskBreadcrumb />
        </div>
        {children}
      </div>
    </div>
  );
}
