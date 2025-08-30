import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { FC } from "react";

export const CategoryBadge: FC<{ color: string; name: string }> = (props) => {
  return (
    <Badge
      variant="outline"
      style={{ "--category-color": props.color } as React.CSSProperties}
      className={cn(
        "border-2 h-min border-(--category-color) text-(--category-color) hover:scale-110 hover:transition ",
      )}
    >
      {props.name}
    </Badge>
  );
};
