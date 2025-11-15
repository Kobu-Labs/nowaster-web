import { Square, SquareCheckBig } from "lucide-react";
import { FC } from "react";

type TaskBadgeProps = {
  name: string;
  completed?: boolean;
};

export const TaskBadge: FC<TaskBadgeProps> = (props) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {props.completed ? (
        <SquareCheckBig className="h-4 w-4 text-green-600" />
      ) : (
        <Square className="h-4 w-4 text-green-600" />
      )}
      <h4 className="font-semibold text-sm">{props.name}</h4>
    </div>
  );
};
