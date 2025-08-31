import type { FC } from "react";
import { tagColors } from "@/state/tags";

import { cn, randomColor } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
import type { TagWithId } from "@/api/definitions";
import { useAtom } from "jotai";

type TagBadgeProps =
  | {
      colors?: string;
      value: string;
      variant: "manual";
    }
  | {
      tag: TagWithId;
      variant: "auto";
    };

const TagBadgeInner = (props: { color: string; label: string }) => {
  return (
    <Badge
      className={cn(
        "h-min w-min bg-(--tag-color) text-white hover:scale-110 hover:bg-(--tag-color) hover:transition whitespace-nowrap",
      )}
      style={{ "--tag-color": props.color } as React.CSSProperties}
    >
      {props.label}
    </Badge>
  );
};

const TagBadgeAuto = (props: { tag: TagWithId }) => {
  const [colors, setColors] = useAtom(tagColors);

  const color = colors[props.tag.label] ?? props.tag.color;
  if (colors[props.tag.label] === undefined) {
    setColors({ ...colors, [props.tag.label]: color });
  }

  return <TagBadgeInner color={color} label={props.tag.label} />;
};

const TagBadgeManual = (props: { color?: string; value: string; }) => {
  return (
    <TagBadgeInner color={props.color ?? randomColor()} label={props.value} />
  );
};

export const TagBadge: FC<TagBadgeProps> = (props) => {
  if (props.variant === "auto") {
    return <TagBadgeAuto tag={props.tag} />;
  }

  if (props.variant === "manual") {
    return <TagBadgeManual color={props.colors} value={props.value} />;
  }

  return null;
};
