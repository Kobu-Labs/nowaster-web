import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/shadcn/tooltip";
import { format, formatDistanceToNow } from "date-fns";
import { FC } from "react";

type RelativeDateProps = {
  date: Date;
};
export const RelativeDate: FC<RelativeDateProps> = (props) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(props.date, { addSuffix: true })}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p>{format(props.date, "dd-MM-yyyy HH:mm")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
