import { FC } from "react";
import { ScheduledSession } from "@/api/definitions";
import { VariantProps, cva } from "class-variance-authority";

import { cn, getFormattedTimeDifference } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";

type SessionCardProps = {
  session: ScheduledSession;
} & VariantProps<typeof historyCardVariants> &
  React.HTMLAttributes<HTMLDivElement>;

const historyCardVariants = cva(
  "hover:bg-accent hover:text-accent-foreground hover:cursor-pointer",
  {
    variants: {
      variant: {
        default: "border border-input",
        borderless: "border-hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export const SessionCard: FC<SessionCardProps> = (props) => {
  return (
    <Card
      {...props}
      className={cn(
        historyCardVariants({ variant: props.variant }),
        props.className,
        "text-nowrap",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {props.session.category.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0">
        <div>
          <p className="text-sm text-muted-foreground">
            {props.session.description}
          </p>
          <div className="mt-1 flex">
            {props.session.tags.map((tag) => (
              <TagBadge tag={tag} variant="auto" key={tag.id} />
            ))}
          </div>
        </div>
        <div className="grow" />
        <div className="ml-4 text-xl font-medium">
          {getFormattedTimeDifference(
            props.session.startTime,
            props.session.endTime,
          )}
        </div>
      </CardContent>
    </Card>
  );
};
