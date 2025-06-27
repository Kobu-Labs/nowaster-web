import { SessionTemplateApi } from "@/api";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/shadcn/dropdown-menu";
import { Separator } from "@radix-ui/react-separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMinutes,
  addWeeks,
  format,
  isSameDay,
  max,
  set,
  startOfDay,
  startOfWeek,
} from "date-fns";
import {
  Calendar,
  CopyIcon,
  Edit,
  EditIcon,
  MoreHorizontal,
  Trash,
  Trash2,
} from "lucide-react";
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
  }
};

const closestAfterGivenDate = (
  lowerBoundDate: Date,
  time: { minutes: number; hours: number; day: number },
): Date => {
  let result = new Date(lowerBoundDate);

  const currentDay = result.getDay();
  const targetDay = time.day;

  // If it's the same day, check if the time has already passed
  if (currentDay === targetDay) {
    // Set the time for today
    const todayWithTargetTime = set(new Date(result), {
      hours: time.hours,
      minutes: time.minutes,
      seconds: 0,
      milliseconds: 0,
    });

    // If the target time today is after the lower bound, use today
    if (todayWithTargetTime >= lowerBoundDate) {
      return todayWithTargetTime;
    }
  }

  // Otherwise, we need to go to next week
  result = addDays(result, 7);

  // Set the target time
  result.setHours(time.hours, time.minutes, 0, 0);

  return result;
};

const getClosesToBasedOnInterval = (
  lowerBoundDate: Date,
  time: { minutes: number; hours: number; day: number },
  interval: RecurringSessionInterval,
): Date => {
  switch (interval) {
    case "daily": {
      // For daily, we can just set the time for today
      const todayWithTargetTime = set(new Date(lowerBoundDate), {
        hours: time.hours,
        minutes: time.minutes,
        seconds: 0,
        milliseconds: 0,
      });

      // If the target time today is after the lower bound, use today
      if (todayWithTargetTime >= lowerBoundDate) {
        return todayWithTargetTime;
      }
      // Otherwise, we need to go to the next day
      return addDays(todayWithTargetTime, 1);
    }
    case "weekly": {
      return closestAfterGivenDate(lowerBoundDate, time);
    }
  }
};

export function TemplateOverview({ template }: { template: SessionTemplate }) {
  // INFO: Calculate session times based on the template and todays date, only future session dates are shown
  const sessionTimes = useMemo(() => {
    return template.sessions.map((session) => {
      const startTime = addMinutes(
        template.start_date,
        session.start_minute_offset,
      );
      console.log("start_time", startTime);

      let closestStartTime = getClosesToBasedOnInterval(
        max([startTime, new Date()]),
        {
          day: startTime.getDay(),
          hours: startTime.getHours(),
          minutes: startTime.getMinutes(),
        },
        template.interval,
      );
      console.log("start_time closes", closestStartTime);

      let closestEndTime = addMinutes(
        closestStartTime,
        session.end_minute_offset - session.start_minute_offset,
      );

      return {
        ...session,
        closestStartTime,
        closestEndTime,
      };
    });
  }, [template.sessions, template.interval]);

  const queryClient = useQueryClient();

  const handleDeleteTemplate = useMutation({
    mutationKey: ["session-template", "deleteTemplate"],
    mutationFn: async (templateId: string) => {
      await SessionTemplateApi.deleteTemplate({
        id: templateId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
    },
  });

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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <EditIcon className="p-1" />
                  Edit Template
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <CopyIcon className="p-1" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive flex items-center gap-2"
                  onClick={() => handleDeleteTemplate.mutate(template.id)}
                >
                  <Trash className="p-1" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                        startTime: session.closestStartTime,
                        endTime: session.closestEndTime,
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
