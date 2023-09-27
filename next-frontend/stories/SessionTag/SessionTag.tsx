import { Badge } from "@/components/ui/badge";
import { cn, randomColor } from "@/lib/utils";
import { tagColors } from "@/state/tags";
import { FC } from "react";
import { useRecoilState } from "recoil";

type SessionTagProps = {
  value: string
}

export const SessionTag: FC<SessionTagProps> = (props) => {
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
