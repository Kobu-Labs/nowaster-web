import { FC } from "react";
import { tagColors } from "@/state/tags";
import { useRecoilState } from "recoil";

import { cn, randomColor } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";

type TagBadgeProps = {
  value: string;
  colors?: string;
};

export const TagBadge: FC<TagBadgeProps> = (props) => {
  const [colors, setColors] = useRecoilState(tagColors);

  if (colors[props.value] === undefined && !props.colors) {
    setColors({ ...colors, [props.value]: randomColor() });
  }

  const color = props.colors ?? colors[props.value];

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
