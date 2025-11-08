import type { FC } from "react";
import { useState } from "react";

import type { TaskWithId } from "@/api/definitions";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { CheckCircle2, Circle, Frown } from "lucide-react";
import { useTasksByProject } from "@/components/hooks/project/useTasksByProject";
import { cn } from "@/lib/utils";

type TaskPickerProps = {
  onSelectTask?: (task: null | TaskWithId) => void;
  placeholder?: string;
  projectId: string;
  selectedTask?: null | TaskWithId;
};

export const TaskPicker: FC<TaskPickerProps> = (props) => {
  const tasks = useTasksByProject(props.projectId);
  const [selectedTask, setSelectedTask] = useState<null | TaskWithId>(null);

  const isControlled = props.selectedTask !== undefined;
  const value = isControlled ? props.selectedTask : selectedTask;

  const onSelectTask = (taskId: string) => {
    const task = tasks.data?.find((t) => t.id === taskId) ?? null;
    if (!isControlled) {
      setSelectedTask(task);
    }
    props.onSelectTask?.(task);
  };

  const onClear = () => {
    if (!isControlled) {
      setSelectedTask(null);
    }
    props.onSelectTask?.(null);
  };

  if (!props.projectId) {
    return (
      <Select disabled value="none">
        <SelectTrigger>
          <SelectValue placeholder="Select a project first" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">
              Select a project first
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (tasks.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (tasks.isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
    );
  }

  return (
    <Select
      onValueChange={(val) => {
        if (val === "none") {
          onClear();
        } else {
          onSelectTask(val);
        }
      }}
      value={value?.id ?? "none"}
    >
      <SelectTrigger>
        <SelectValue placeholder={props.placeholder ?? "Select a task"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No task</span>
        </SelectItem>
        {tasks.data?.map((task) => (
          <SelectItem key={task.id} value={task.id}>
            <div className="flex flex-row items-center gap-2">
              {task.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "flex-1",
                  task.completed && "line-through text-muted-foreground",
                )}
              >
                {task.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
