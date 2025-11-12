"use client";

import type { ProjectWithId } from "@/api/definitions/models/project";
import { useProjectStats } from "@/components/hooks/project/useProjectStats";
import { useProjectsWithTaskCount } from "@/components/hooks/project/useProjectsWithTaskCount";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CreateProjectDialog } from "@/components/visualizers/projects/CreateProjectDialog";
import { EditProjectDialog } from "@/components/visualizers/projects/EditProjectDialog";
import { ProjectCard } from "@/components/visualizers/projects/ProjectCard";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  Search,
} from "lucide-react";
import { useMemo, useState, type FC } from "react";

const ProjectsPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProject, setEditingProject] = useState<null | ProjectWithId>(
    null,
  );

  const projectsQuery = useProjectsWithTaskCount();
  const statsQuery = useProjectStats();

  const filteredProjects = useMemo(() => {
    if (!projectsQuery.data) {
      return [];
    }

    const filtered = projectsQuery.data.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [projectsQuery.data, searchQuery]);

  if (projectsQuery.isPending || statsQuery.isPending) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="h-64" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (projectsQuery.isError || statsQuery.isError) {
    return (
      <div className="w-full p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Projects
            </CardTitle>
            <CardDescription>
              There was an error loading your projects or statistics. Please try
              refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="flex gap-6 w-full p-6">
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and organize your projects and tasks
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground hover:border-pink-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_projects}</div>
              <p className="text-xs text-muted-foreground">
                All projects in your workspace
              </p>
            </CardContent>
          </Card>

          <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground hover:border-pink-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_projects}</div>
              <p className="text-xs text-muted-foreground">
                Projects currently in progress
              </p>
            </CardContent>
          </Card>

          <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground hover:border-pink-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Projects
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completed_projects}
              </div>
              <p className="text-xs text-muted-foreground">
                Projects marked as complete
              </p>
            </CardContent>
          </Card>

          <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground hover:border-pink-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks across all projects
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search projects..."
            value={searchQuery}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              onEdit={() => {
                setEditingProject(project);
              }}
              project={project}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No projects found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? `No projects match "${searchQuery}". Try adjusting your search.`
                      : "Create your first project to start organizing your tasks."}
                  </p>
                </div>
                {!searchQuery && <CreateProjectDialog />}
              </div>
            </CardContent>
          </Card>
        )}

        <EditProjectDialog
          onOpenChange={(open) => !open && setEditingProject(null)}
          open={!!editingProject}
          project={editingProject}
        />
      </div>
    </div>
  );
};

export default ProjectsPage;
