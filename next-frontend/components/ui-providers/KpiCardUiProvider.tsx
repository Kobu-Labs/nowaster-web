import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Frown } from "lucide-react";

export type KpiCardUiProviderProps<T extends ReactNode> = {
  children?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean;
  loading?: boolean;
  mapper?: (value: T) => number | string;
  title: string;
  value?: T;
} & VariantProps<typeof cardVariants>;

const cardVariants = cva(
  "font-bold group-hover:scale-y-125 group-hover:text-pink-300 group-hover:transition",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        big_value: "flex text-7xl grow items-center justify-center",
        default: "text-2xl ",
      },
    },
  },
);

/* TODO: this component got violated beyond comprehension */
export function KpiCardUiProvider<T extends ReactNode>(
  props: KpiCardUiProviderProps<T>,
) {
  return (
    <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        <div>{props.children}</div>
      </CardHeader>
      <CardContent className={cn(cardVariants({ variant: props.variant }))}>
        {props.error
          ? (
              <Frown className="text-red-500 grow" />
            )
          : props.loading
            ? (
                <Skeleton className="w-full h-full min-h-20" />
              )
            : props.mapper && props.value !== undefined
              ? (
                  (props.mapper(props.value) as React.ReactNode)
                )
              : (
                  props.value
                )}
      </CardContent>
      {props.description && (
        <CardFooter className="text-xs text-muted-foreground">
          {props.description}
        </CardFooter>
      )}
    </Card>
  );
}
