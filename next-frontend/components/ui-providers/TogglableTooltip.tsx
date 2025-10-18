import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { FC, PropsWithChildren, ReactNode } from "react";

type TogglableTooltipProps = {
  showTooltip: boolean;
  tooltipContent?: ReactNode;
};

export const TogglableTooltip: FC<PropsWithChildren<TogglableTooltipProps>> = (
  props,
) => {
  if (props.showTooltip) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{props.children}</span>
          </TooltipTrigger>
          <TooltipContent>{props.tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return props.children;
};
