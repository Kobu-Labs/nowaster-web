import type {
  RecurringSession,
  SessionTemplate,
} from "@/api/definitions/models/session-template";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { format24Hour, numberToDay } from "@/lib/date-utils";
import { addMinutes } from "date-fns";
import { Clock } from "lucide-react";
import type { FC} from "react";
import { useMemo } from "react";

interface SessionCardProps {
  session: RecurringSession;
  template: SessionTemplate;
}

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
      return `Every ${numberToDay(start.getDay())} at ${format24Hour(start)}-${format24Hour(end)}`;
    }
    }
  }, [props.template, props.session]);

  return (
    <Card className="group overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <CardHeader className="pb-3 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 gradient-decoration rounded-bl-full" />

        <div className="flex items-center gap-3 relative">
          <div className="w-1 h-6 gradient-accent-bar rounded-full" />
          <CardTitle className="text-lg font-semibold gradient-text-hover">
            {props.session.category.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Tags section */}
        {props.session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {props.session.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} variant="auto" />
            ))}
          </div>
        )}

        {/* Schedule section */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-pink-muted">
          <div className="w-6 h-6 gradient-container-subtle rounded flex items-center justify-center">
            <Clock className="w-3 h-3 text-pink-primary" />
          </div>
          <span className="font-medium text-foreground">{calculatePeriod}</span>
        </div>
      </CardContent>
    </Card>
  );
};
