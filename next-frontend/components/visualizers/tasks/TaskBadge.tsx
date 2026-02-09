import { cn } from "@/lib/utils";
import { Square, SquareCheckBig } from "lucide-react";
import { FC } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const iconVariants = cva("text-green-600", {
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "h-5 w-5",
      md: "h-4 w-4",
      sm: "h-3 w-3",
    },
  },
});

const textVariants = cva("font-semibold", {
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "text-base",
      md: "text-sm",
      sm: "text-xs",
    },
  },
});

type TaskBadgeProps = {
  completed?: boolean;
  name: string;
  // INFO: this prop can be used to render the badge without the line-through class
  // can be used in filter pickers, feed events etc
  skipStrikethrough?: boolean;
} & VariantProps<typeof textVariants>;

export const TaskBadge: FC<TaskBadgeProps> = ({
  completed,
  name,
  size,
  skipStrikethrough,
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {completed
        ? (
            <SquareCheckBig className={iconVariants({ size })} />
          )
        : (
            <Square className={iconVariants({ size })} />
          )}
      <h4
        className={cn(
          textVariants({ size }),
          completed && !skipStrikethrough && "line-through",
        )}
      >
        {name}
      </h4>
    </div>
  );
};
