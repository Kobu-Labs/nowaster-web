import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = { label: string; color: string; selected?: boolean; className?: string };

/** Filled pill in the tag colour, matching the web app. Unselected tags in the picker are outlined. */
export const TagBadge: FC<Props> = ({ label, color, selected = true, className }) => (
  <Badge
    variant="outline"
    className={cn(
      "h-min max-w-full whitespace-nowrap transition-transform hover:scale-105",
      selected ? "border-transparent text-white" : "border-2",
      className,
    )}
    style={selected ? { background: color } : { borderColor: color, color }}
  >
    <span className="truncate">{label}</span>
  </Badge>
);
