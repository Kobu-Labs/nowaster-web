import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { Folder, FolderCheck } from "lucide-react";
import type { FC } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("font-bold flex items-center w-fit", {
  defaultVariants: {
    size: "sm",
  },
  variants: {
    size: {
      lg: "px-2.5 py-1 text-base gap-1.5",
      md: "px-2 py-0.5 text-sm gap-1",
      sm: "px-1.5 py-0.5 text-xs gap-1",
    },
  },
});

const iconVariants = cva("", {
  defaultVariants: {
    size: "sm",
  },
  variants: {
    size: {
      lg: "size-5",
      md: "size-4",
      sm: "size-3",
    },
  },
});

type ProjectBadgeProps = {
  color: string;
  completed?: boolean;
  name: string;
  // INFO: this prop can be used to render the badge without the line-through class
  // can be used in filter pickers, feed events etc
  skipStrikethrough?: boolean;
} & VariantProps<typeof badgeVariants>;

export const ProjectBadge: FC<ProjectBadgeProps> = ({
  color,
  completed,
  name,
  size,
  skipStrikethrough,
}) => {
  return (
    <Badge
      className={badgeVariants({ size })}
      style={{
        backgroundColor: `${color}20`,
        color,
      }}
      variant="secondary"
    >
      {completed
        ? (
            <FolderCheck className={iconVariants({ size })} />
          )
        : (
            <Folder className={iconVariants({ size })} />
          )}
      <span className={cn(completed && !skipStrikethrough && "line-through")}>
        {name}
      </span>
    </Badge>
  );
};
