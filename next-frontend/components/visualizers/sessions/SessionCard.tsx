import type { ScheduledSession } from "@/api/definitions";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { FC } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { cn, getFormattedTimeDifference } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
import { CalendarSync } from "lucide-react";

type SessionCardProps = {
  durationElement?: (startDate: Date, endDate: Date) => React.ReactNode;
  session: ScheduledSession;
} & React.HTMLAttributes<HTMLDivElement>
& VariantProps<typeof historyCardVariants>;

const historyCardVariants = cva("hover:cursor-pointer", {
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      borderless: "border-hidden",
      default: "border",
    },
  },
});

export const SessionCard: FC<SessionCardProps> = (props) => {
  let durationChild: React.ReactNode = (
    <div className="ml-4 text-xl font-medium">
      {getFormattedTimeDifference(
        props.session.startTime,
        props.session.endTime,
      )}
    </div>
  );

  if (props.durationElement) {
    durationChild = props.durationElement(
      props.session.startTime,
      props.session.endTime,
    );
  }

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
        <CardTitle className="text-2xl font-bold flex gap-8 items-center">
          {props.session.category.name}
          {props.session.template && (
            <Badge className="text-sm flex items-center gap-2">
              <CalendarSync className="size-4" />
              {props.session.template.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0">
        <div>
          <p className="text-sm text-muted-foreground">
            {props.session.description}
          </p>
          <div className="mt-1 flex gap-1">
            {props.session.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} variant="auto" />
            ))}
          </div>
        </div>
        <div className="grow" />
        {durationChild}
      </CardContent>
    </Card>
  );
};
