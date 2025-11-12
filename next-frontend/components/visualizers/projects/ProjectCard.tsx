"use client";

import type { ProjectWithTaskCount } from "@/api/definitions/models/project";
import { useDeleteProject } from "@/components/hooks/project/useDeleteProject";
import { useUpdateProject } from "@/components/hooks/project/useUpdateProject";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Edit,
  Eye,
  ListTodo,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

type ProjectCardProps = {
  onEdit: () => void;
  project: ProjectWithTaskCount;
};

export const ProjectCard: FC<ProjectCardProps> = ({ onEdit, project }) => {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const handleToggleComplete = (completed: boolean) => {
    updateProject.mutate({
      completed,
      id: project.id,
    });
  };

  const completionPercentage =
    project.taskCount > 0
      ? Math.round((project.completedTaskCount / project.taskCount) * 100)
      : 0;

  return (
    <Link href={`/home/projects/${project.id}`}>
      <Card
        className={cn(
          "group backdrop-blur-md bg-white/80 dark:bg-gray-900/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-lg cursor-pointer",
        )}
        style={{ borderLeft: `4px solid ${project.color}` }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <ProjectAvatar
                color={project.color}
                imageUrl={project.image_url}
                name={project.name}
              />
              <div className="flex flex-col">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                {project.completed && (
                  <Badge className="w-fit" variant="secondary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-2 cursor-pointer"
                    href={`/home/projects/${project.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      asChild
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <div>
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </div>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete "{project.name}
                        "?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone and will remove the project
                        and all its tasks ({project.taskCount} tasks).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteProject.mutate({ id: project.id });
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tasks</span>
            </div>
            <Badge variant="outline">
              {project.completedTaskCount} /{project.taskCount}
            </Badge>
          </div>

          {project.taskCount > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: project.color,
                    width: `${completionPercentage}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {completionPercentage}% complete
              </p>
            </div>
          )}

          <div
            className="flex items-center gap-2 pt-3 border-t"
            onClick={(e) => e.preventDefault()}
          >
            <Checkbox
              checked={project.completed}
              onCheckedChange={handleToggleComplete}
            />
            <span className="text-sm">Mark as completed</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
