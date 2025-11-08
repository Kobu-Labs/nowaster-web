import type { FC } from "react";
import { useState } from "react";

import type { TaskWithId } from "@/api/definitions";
import { useTasksByProject } from "@/components/hooks/project/useTasksByProject";
import { Skeleton } from "@/components/shadcn/skeleton";
import { TaskPickerUiProvider } from "@/components/ui-providers/tasks/TaskPickerUiProvider";
import { Frown } from "lucide-react";

type TaskPickerProps = {
  onSelectTask?: (task: null | TaskWithId) => void;
  placeholder?: string;
  projectId: null | string;
  selectedTask?: null | TaskWithId;
};

export const TaskPicker: FC<TaskPickerProps> = (props) => {
  const tasks = useTasksByProject(props.projectId);
  const [selectedTask, setSelectedTask] = useState<null | TaskWithId>(null);

  const isControlled = props.selectedTask !== undefined;
  const value = isControlled ? (props.selectedTask ?? null) : selectedTask;

  const onSelectTask = (task: null | TaskWithId) => {
    if (!isControlled) {
      setSelectedTask(task);
    }
    props.onSelectTask?.(task);
  };

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
    <TaskPickerUiProvider
      availableTasks={tasks.data}
      onSelectTask={onSelectTask}
      placeholder={props.placeholder}
      selectedTask={value}
    />
  );
};
