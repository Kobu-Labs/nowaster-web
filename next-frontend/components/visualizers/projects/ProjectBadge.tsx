import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { Folder, FolderCheck } from "lucide-react";
import type { FC } from "react";

type ProjectBadgeProps = {
  color: string;
  name: string;
  completed?: boolean;
  // INFO: this prop can be used to render the badge without the line-through class
  // can be used in filter pickers, feed events etc
  skipStrikethrough?: boolean;
};

export const ProjectBadge: FC<ProjectBadgeProps> = ({
  color,
  name,
  completed,
  skipStrikethrough,
}) => {
  return (
    <Badge
      className="font-bold flex items-center gap-1 px-2 py-0.5 w-fit"
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
      variant="secondary"
    >
      {completed ? (
        <FolderCheck className="size-4" />
      ) : (
        <Folder className="size-4" />
      )}
      <span className={cn(completed && !skipStrikethrough && "line-through")}>
        {name}
      </span>
    </Badge>
  );
};
