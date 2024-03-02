import { Badge } from "@/components/shadcn/badge";
import { cn, randomColor } from "@/lib/utils";
import { tagColors } from "@/state/tags";
import { FC } from "react";
import { useRecoilState } from "recoil";

type TagBadgeProps = {
  value: string
}

export const TagBadge: FC<TagBadgeProps> = (props) => {
  const [colors, setColors] = useRecoilState(tagColors);

  if (colors[props.value] === undefined) {
    setColors({ ...colors, [props.value]: randomColor() });
  };

  return (
    <Badge
      style={{ "--tag-color": colors[props.value] } as React.CSSProperties}
      className={cn(
        "h-min bg-[var(--tag-color)] text-white hover:scale-110 hover:bg-[var(--tag-color)] hover:transition ")
      }
    >
      {props.value}
    </Badge>
  );
};
