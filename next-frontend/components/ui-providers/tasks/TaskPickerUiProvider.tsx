import type { TaskWithId } from "@/api/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import type { FC } from "react";

export type TaskPickerUiProviderProps = {
  availableTasks: TaskWithId[];
  onSelectTask: (task: null | TaskWithId) => void;
  placeholder?: string;
  selectedTaskId: null | string;
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
