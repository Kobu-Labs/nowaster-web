import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import type { FC } from "react";

export const CategoryBadge: FC<{ color: string; name: string }> = (props) => {
  return (
    <Badge
      className={cn(
        "border-2 h-min border-(--category-color) text-(--category-color) hover:scale-110 hover:transition ",
      )}
      style={{ "--category-color": props.color } as React.CSSProperties}
      variant="outline"
    >
      {props.name}
    </Badge>
  );
};
