import {
  RecurringSessionInterval,
  SessionTemplate,
} from "@/api/definitions/models/session-template";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { SessionCard } from "@/components/visualizers/sessions/SessionCard";
import { TemplateIntervalBadge } from "@/components/visualizers/sessions/templates/TemplateIntervalBadge";
import { getFormattedTimeDifference } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";
import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { useMemo } from "react";

export const intervalToStartOf = (
  interval: RecurringSessionInterval,
  asOf: Date,
): Date => {
  switch (interval) {
    case "daily":
      return startOfDay(asOf);
    case "weekly":
      return startOfWeek(asOf);
    case "bi-weekly":
      return startOfWeek(asOf);
    case "monthly":
      return startOfMonth(asOf);
  }
};

const incrementByInterval = (
  interval: RecurringSessionInterval,
  date: Date,
): Date => {
  switch (interval) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "bi-weekly":
      return addWeeks(date, 2);
    case "monthly":
      return addMonths(date, 1);
  }
};

export function TestSessions({
  template,
}: {
  template: SessionTemplate;
}) {
  const relativeDate = useMemo(
    () => intervalToStartOf(template.interval, new Date()),
    [template.interval],
  );

  // INFO: Calculate session times based on the templat and todays date, only future session dates are shown
  const sessionTimes = useMemo(() => {
    const now = new Date();
    return template.sessions.map((session) => {
      let startTime = addMinutes(relativeDate, session.start_minute_offset);
      if (isBefore(startTime, now)) {
        startTime = incrementByInterval(template.interval, startTime);
      }
      let endTime = addMinutes(relativeDate, session.end_minute_offset);
      if (isBefore(endTime, now)) {
        endTime = incrementByInterval(template.interval, endTime);
      }
      return {
        ...session,
        startTime,
        endTime,
      };
    });
  }, [relativeDate, template.sessions]);

  const closestSession = useMemo(() => {
    return sessionTimes.reduce((closest, session) => {
      if (!closest || session.startTime < closest.startTime) {
        return session;
      }
      return closest;
    }, sessionTimes[0]);
  }, [sessionTimes]);

  return (
    <Card key={template.id} className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{template.name}</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <TemplateIntervalBadge interval={template.interval} />
              {closestSession &&
                `Next session: ${format(closestSession.startTime, "cccc dd. HH:mm")} `}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewTemplate(template)}
            >
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTemplate(template)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTemplate(template.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {template.sessions.length > 0 ? (
          <div className="space-y-4">
            {/* Session Statistics */}

            <Separator />

            {/* Sessions List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                Sessions Templates
              </h4>
              <div className="space-y-2">
                {sessionTimes.map((session, index) => {
                  return (
                    <SessionCard
                      durationElement={(start, end) => {
                        return (
                          <div className="ml-4 text-xl font-medium text-muted-foreground">
                            {format(start, " cccc, dd. HH:mm - ")}
                            {format(
                              end,
                              isSameDay(start, end)
                                ? "HH:mm"
                                : "cccc dd. HH:mm",
                            )}
                            {` (${getFormattedTimeDifference(start, end)})`}
                          </div>
                        );
                      }}
                      session={{
                        ...session,
                        session_type: "fixed",
                      }}
                      key={index}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No sessions created yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
