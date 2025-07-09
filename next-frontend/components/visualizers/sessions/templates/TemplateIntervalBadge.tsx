import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { CalendarSync } from "lucide-react";
import { FC } from "react";

const getIntervalBadgeColor = (interval: string) => {
  switch (interval) {
  case "daily":
    return "text-purple-300";
  case "weekly":
    return "text-pink-600";
  case "monthly":
    return "text-purple-800";
  default:
    return "text-gray-800";
  }
};

export const TemplateIntervalBadge: FC<{
  interval: RecurringSessionInterval;
}> = (props) => {
  return (
    <Badge
      className={cn(
        getIntervalBadgeColor(props.interval),
        "flex items-center gap-2 w-fit",
      )}
    >
      <CalendarSync className="size-3" />
      {props.interval}
    </Badge>
  );
};
