import { FC } from "react";
import { cn, randomColor } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
import { useTagColors } from "@/components/hooks/useTagColors";
import { TagWithId } from "@/api/definitions";

type TagBadgeProps = {
  value: string;
  color?: string;
  tag?: TagWithId;
};

export const TagBadge: FC<TagBadgeProps> = (props) => {
  const { setColor, colors } = useTagColors();

  let color = props.color;
  if (props.tag) {
    color = colors[props.tag.label];
  }
  color = color ?? randomColor();

  if (props.tag) {
    setColor({ key: props.tag.id, color });
  }

  return (
    <Badge
      style={{ "--tag-color": color } as React.CSSProperties}
      className={cn(
        "h-min bg-[var(--tag-color)] text-white hover:scale-110 hover:bg-[var(--tag-color)] hover:transition ",
      )}
    >
      {props.value}
    </Badge>
  );
};
