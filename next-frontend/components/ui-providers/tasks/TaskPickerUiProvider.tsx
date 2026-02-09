import type { TaskWithId } from "@/api/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { TaskBadge } from "@/components/visualizers/tasks/TaskBadge";
import type { FC } from "react";

export type TaskPickerUiProviderProps = {
  availableTasks: TaskWithId[];
  onSelectTask: (task: null | TaskWithId) => void;
  placeholder?: string;
  selectedTaskId: null | string;
  // INFO: this prop can be used to render the badge without the line-through class
  // can be used in filter pickers, feed events etc
  skipStrikethrough?: boolean;
};

export const TaskPickerUiProvider: FC<TaskPickerUiProviderProps> = (props) => {
  const onValueChange = (val: string) => {
    if (val === "none") {
      props.onSelectTask(null);
    } else {
      const task = props.availableTasks.find((t) => t.id === val) ?? null;
      props.onSelectTask(task);
    }
  };

  return (
    <Select
      onValueChange={onValueChange}
      value={props.selectedTaskId ?? "none"}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={props.placeholder ?? "Select a task"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No task</span>
        </SelectItem>
        {props.availableTasks.map((task) => (
          <SelectItem key={task.id} value={task.id}>
            <TaskBadge
              completed={task.completed}
              name={task.name}
              skipStrikethrough={props.skipStrikethrough}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
