import {
  RecurringSession,
  SessionTemplate,
} from "@/api/definitions/models/session-template";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shadcn/card";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { format24Hour, numberToDay } from "@/lib/date-utils";
import { addMinutes } from "date-fns";
import { FC, useMemo } from "react";

type SessionCardProps = {
  session: RecurringSession;
  template: SessionTemplate;
};

export const RecurringSessionCard: FC<SessionCardProps> = (props) => {
  const calculatePeriod = useMemo(() => {
    const start = addMinutes(
      props.template.start_date,
      props.session.start_minute_offset,
    );
    const end = addMinutes(
      start,
      props.session.end_minute_offset - props.session.start_minute_offset,
    );

    switch (props.template.interval) {
      case "daily": {
        return `Every day at ${format24Hour(start)}-${format24Hour(end)}`;
      }

      case "weekly": {
        return `${numberToDay(start.getDay())} at ${format24Hour(start)}-${format24Hour(end)}`;
      }
    }
  }, [props.template, props.session]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-3xl font-bold">
          {props.session.category.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 items-center justify-center">
        <div>
          {props.session.tags.map((tag) => (
            <TagBadge tag={tag} variant="auto" key={tag.id} />
          ))}
        </div>
        <div className="grow" />
        <div>
          <div className="text-sm text-muted-foreground">{calculatePeriod}</div>
        </div>
      </CardContent>
    </Card>
  );
};
