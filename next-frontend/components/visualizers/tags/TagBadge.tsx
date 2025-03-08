import { FC } from "react";
import { tagColors } from "@/state/tags";
import { useRecoilState } from "recoil";

import { cn, randomColor } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
import { TagWithId } from "@/api/definitions";

type TagBadgeProps =
  | {
      value: string;
      colors?: string;
      variant: "manual";
    }
  | {
      variant: "auto";
      tag: TagWithId;
    };

const TagBadgeInner = (props: { color: string; label: string }) => {
  return (
    <Badge
      style={{ "--tag-color": props.color } as React.CSSProperties}
      className={cn(
        "h-min bg-[var(--tag-color)] text-white hover:scale-110 hover:bg-[var(--tag-color)] hover:transition ",
      )}
    >
      {props.label}
    </Badge>
  );
};

const TagBadgeAuto = (props: { tag: TagWithId }) => {
  const [colors, setColors] = useRecoilState(tagColors);

  const color = colors[props.tag.label] ?? props.tag.color;
  if (colors[props.tag.label] === undefined) {
    setColors({ ...colors, [props.tag.label]: color });
  }

  return <TagBadgeInner color={color} label={props.tag.label} />;
};

const TagBadgeManual = (props: { value: string; color?: string }) => {
  return (
    <TagBadgeInner color={props.color ?? randomColor()} label={props.value} />
  );
};

export const TagBadge: FC<TagBadgeProps> = (props) => {
  if (props.variant === "auto") {
    return <TagBadgeAuto tag={props.tag} />;
  }

  if (props.variant === "manual") {
    return <TagBadgeManual value={props.value} color={props.colors} />;
  }

  return null;
};
