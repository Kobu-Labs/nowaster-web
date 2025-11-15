import { Badge } from "@/components/shadcn/badge";
import { Folder, FolderCheck } from "lucide-react";
import type { FC } from "react";

type ProjectBadgeProps = {
  color: string;
  name: string;
  completed?: boolean;
};

export const ProjectBadge: FC<ProjectBadgeProps> = ({
  color,
  name,
  completed,
}) => {
  return (
    <Badge
      className="font-bold flex items-center gap-1 px-2 py-0.5"
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
      variant="secondary"
    >
      {completed ? (
        <FolderCheck className="size-3.5" />
      ) : (
        <Folder className="size-3.5" />
      )}
      {name}
    </Badge>
  );
};
