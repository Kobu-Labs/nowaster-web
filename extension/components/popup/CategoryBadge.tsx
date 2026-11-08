import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = { name: string; color: string; selected?: boolean; className?: string };

/** Outlined pill in the category colour, matching the web app. Selected adds a light tint. */
export const CategoryBadge: FC<Props> = ({ name, color, selected = false, className }) => (
  <Badge
    variant="outline"
    className={cn("h-min max-w-full border-2 whitespace-nowrap transition-transform hover:scale-105", className)}
    style={{ borderColor: color, color, background: selected ? `${color}33` : undefined }}
  >
    <span className="truncate">{name}</span>
  </Badge>
);
