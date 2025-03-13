import { ReactNode } from "react";
import { VariantProps, cva } from "class-variance-authority";

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

type KpiCardUiProviderProps<T extends ReactNode> = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  loading?: boolean;
  value?: T;
  error?: boolean;
  mapper?: (value: T) => string | number;
} & VariantProps<typeof cardVariants>;

const cardVariants = cva(
  "font-bold group-hover:scale-y-125 group-hover:text-pink-300 group-hover:transition",
  {
    variants: {
      variant: {
        default: "text-2xl ",
        big_value: "flex text-7xl grow items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/* TODO: this component got violated beyond comprehension */
export function KpiCardUiProvider<T extends ReactNode>(
  props: KpiCardUiProviderProps<T>,
) {
  return (
    <Card className="group flex grow flex-col hover:cursor-pointer hover:bg-accent hover:text-accent-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        <div>{props.children}</div>
      </CardHeader>
      <CardContent className={cn(cardVariants({ variant: props.variant }))}>
        {props.error ? (
          <Frown className="text-red-500 grow" />
        ) : props.loading ? (
          <Skeleton className="w-full h-full min-h-20" />
        ) : props.mapper && props.value != undefined ? (
          (props.mapper(props.value) as React.ReactNode)
        ) : (
          props.value
        )}
      </CardContent>
      {props.description && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">{props.description}</p>
        </CardFooter>
      )}
    </Card>
  );
}
