import { cn } from "@/lib/utils";
import { Square, SquareCheckBig } from "lucide-react";
import { FC } from "react";

type TaskBadgeProps = {
  name: string;
  completed?: boolean;
  // INFO: this prop can be used to render the badge without the line-through class
  // can be used in filter pickers, feed events etc
  skipStrikethrough?: boolean;
};

export const TaskBadge: FC<TaskBadgeProps> = (props) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {props.completed ? (
        <SquareCheckBig className="h-4 w-4 text-green-600" />
      ) : (
        <Square className="h-4 w-4 text-green-600" />
      )}
      <h4
        className={cn(
          "font-semibold text-sm",
          props.completed && !props.skipStrikethrough && "line-through",
        )}
      >
        {props.name}
      </h4>
    </div>
  );
};
