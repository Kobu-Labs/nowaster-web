"use client";

import type { TaskWithSessionCount } from "@/api/definitions/models/task";
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
import { Card, CardContent } from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Edit,
  Eye,
  MoreVertical,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { FC } from "react";
import { useUpdateTask } from "@/components/hooks/task/useUpdateTask";
import { useDeleteTask } from "@/components/hooks/task/useDeleteTask";

type TaskCardProps = {
  onEdit: () => void;
  projectColor?: string;
  task: TaskWithSessionCount;
};

export const TaskCard: FC<TaskCardProps> = ({ onEdit, projectColor, task }) => {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggleComplete = (completed: boolean) => {
    updateTask.mutate({
      completed,
      id: task.id,
    });
  };

  return (
    <Link href={`/home/projects/${task.project_id}/tasks/${task.id}`}>
      <Card
        className={cn(
          "group backdrop-blur-md bg-white/80 dark:bg-gray-900/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-lg cursor-pointer",
        )}
        style={{
          borderLeft: projectColor ? `4px solid ${projectColor}` : undefined,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex flex-col">
                <h3 className="font-semibold text-lg">{task.name}</h3>
                {task.completed && (
                  <Badge className="w-fit mt-1" variant="secondary">
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
                    href={`/home/projects/${task.project_id}/tasks/${task.id}`}
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
                  Edit Task
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
                        Delete Task
                      </div>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete "{task.name}
                        "?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone and will remove the task
                        and all its sessions ({task.sessionCount} sessions).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteTask.mutate({ id: task.id });
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

          {task.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sessions</span>
            </div>
            <Badge variant="outline">{task.sessionCount}</Badge>
          </div>

          <div
            className="flex items-center gap-2 pt-3 border-t"
            onClick={(e) => e.preventDefault()}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
            />
            <span className="text-sm">Mark as completed</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
