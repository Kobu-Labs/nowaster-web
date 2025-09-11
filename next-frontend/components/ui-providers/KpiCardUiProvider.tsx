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
        big_value:
          "flex text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-7xl grow items-center justify-center min-h-0",
        default: "text-base sm:text-lg md:text-xl lg:text-2xl",
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight flex-1 pr-1 md:pr-2 break-words hyphens-auto">
          {props.title}
        </CardTitle>
        <div className="shrink-0 ml-1">{props.children}</div>
      </CardHeader>
      <CardContent
        className={cn(
          cardVariants({ variant: props.variant }),
          "px-3 md:px-6 pb-3 md:pb-6 pt-0",
        )}
      >
        {props.error
          ? (
              <Frown className="text-red-500 grow" />
            )
          : props.loading
            ? (
                <Skeleton className="w-full h-full min-h-12 md:min-h-20" />
              )
            : props.mapper && props.value != undefined
              ? (
                  <div className="w-full break-words hyphens-auto text-center">
                    {props.mapper(props.value) as React.ReactNode}
                  </div>
                )
              : (
                  <div className="w-full break-words hyphens-auto text-center">
                    {props.value}
                  </div>
                )}
      </CardContent>
      {props.description && (
        <CardFooter className="text-xs sm:text-sm text-muted-foreground px-3 md:px-6 pb-3 md:pb-6 pt-0">
          <div className="w-full break-words hyphens-auto">
            {props.description}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
