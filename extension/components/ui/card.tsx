import type { FC, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground", className)} {...props} />
);

export const CardHeader: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col gap-1 p-4 pb-2", className)} {...props} />
);

export const CardTitle: FC<HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn("text-sm font-semibold", className)} {...props} />
);

export const CardContent: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-4 pt-2", className)} {...props} />
);
