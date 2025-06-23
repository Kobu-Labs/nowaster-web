import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { Badge } from "@/components/shadcn/badge";
import { FC } from "react";

const getIntervalBadgeColor = (interval: string) => {
  switch (interval) {
    case "daily":
      return "bg-green-100 text-green-800";
    case "weekly":
      return "bg-blue-100 text-blue-800";
    case "monthly":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const TemplateIntervalBadge: FC<{
  interval: RecurringSessionInterval;
}> = (props) => {
  return (
    <Badge className={getIntervalBadgeColor(props.interval)}>
      {props.interval}
    </Badge>
  );
};
