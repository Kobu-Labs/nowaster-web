"use client";

import type { TaskWithSessionCount } from "@/api/definitions/models/task";
import { TaskCard } from "@/components/visualizers/tasks/TaskCard";
import type { FC } from "react";
import { useMemo } from "react";

type TaskListProps = {
  onEditTask: (task: TaskWithSessionCount) => void;
  projectColor?: string;
  tasks: TaskWithSessionCount[];
};

export const TaskList: FC<TaskListProps> = ({
  onEditTask,
  projectColor,
  tasks,
}) => {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.id}
          onEdit={() => {
            onEditTask(task);
          }}
          projectColor={projectColor}
          task={task}
        />
      ))}
    </div>
  );
};
