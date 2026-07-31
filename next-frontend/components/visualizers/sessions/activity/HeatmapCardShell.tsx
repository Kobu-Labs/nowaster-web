"use client";

import type { FC, ReactNode } from "react";

import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useActivityHeatmap } from "@/components/hooks/use-activity-heatmap";
import { cn } from "@/lib/utils";

type HeatmapCardShellProps = {
  children: ReactNode;
  className?: string;
};

// Shared Card/loading-and-error chrome around the heatmap grid and category
// breakdown, which are mounted as independent siblings inside this shell and
// both read the same ActivityHeatmapProvider context.
export const HeatmapCardShell: FC<HeatmapCardShellProps> = (props) => {
  const { isError, isPending } = useActivityHeatmap();

  return (
    <Card className={cn("flex flex-col", props.className)}>
      <CardContent className="p-4">
        {isPending && <Skeleton className="h-[140px] w-full" />}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your activity.
          </p>
        )}
        {!isPending && !isError && props.children}
      </CardContent>
    </Card>
  );
};
