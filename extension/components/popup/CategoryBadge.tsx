import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = { name: string; color: string; className?: string };

/** A category pill with its own colour dot. The white ring keeps the dot visible on the gradient card. */
export const CategoryBadge: FC<Props> = ({ name, color, className }) => (
  <Badge className={cn("max-w-full", className)}>
    <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/70" style={{ background: color }} />
    <span className="truncate">{name}</span>
  </Badge>
);
