import { SessionTemplateApi } from "@/api";
import {
  RecurringSession,
  SessionTemplate,
} from "@/api/definitions/models/session-template";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TemplateIntervalBadge } from "@/components/visualizers/sessions/templates/TemplateIntervalBadge";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { formatTime } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMinutes, format, max } from "date-fns";
import {
  Calendar,
  Clock,
  CopyIcon,
  EditIcon,
  MoreHorizontal,
  Tag,
  Trash,
} from "lucide-react";
import { FC, useMemo } from "react";
import {
  format24Hour,
  getDaytimeAfterDate,
  numberToDay,
} from "@/lib/date-utils";

type SessionCardProps = {
  session: RecurringSession;
  template: SessionTemplate;
};

export const RecurringSessionCard: FC<SessionCardProps> = (props) => {
  const start = addMinutes(
    props.template.start_date,
    props.session.start_minute_offset,
  );
  const end = addMinutes(
    start,
    props.session.end_minute_offset - props.session.start_minute_offset,
  );

  const calculatePeriod = useMemo(() => {
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

const calculateClosestSession = (
  session: Omit<RecurringSession, "id">,
  template: SessionTemplate,
) => {
  const startTime = addMinutes(
    template.start_date,
    session.start_minute_offset,
  );

  let closestStartTime = getDaytimeAfterDate(
    max([startTime, new Date()]),
    template.interval,
    {
      day: startTime.getDay(),
      hours: startTime.getHours(),
      minutes: startTime.getMinutes(),
    },
  );

  let closestEndTime = addMinutes(
    closestStartTime,
    session.end_minute_offset - session.start_minute_offset,
  );

  return {
    ...session,
    closestStartTime,
    closestEndTime,
  };
};

export function TemplateOverview({ template }: { template: SessionTemplate }) {
  // INFO: Calculate session times based on the template and todays date, only future session dates are shown
  const sessionTimes = useMemo(
    () =>
      template.sessions
        .map((session) => calculateClosestSession(session, template))
        // show the closest upcoming sessions first
        .sort(
          (a, b) => b.closestStartTime.getTime() - a.closestStartTime.getTime(),
        ),
    [template.sessions, template.interval],
  );

  const totalSessionDuration = useMemo(() => {
    return template.sessions.reduce((prev, curr) => {
      return curr.end_minute_offset - curr.start_minute_offset + prev;
    }, 0);
  }, [template.sessions]);

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
    <Card className="overflow-hidden">
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
        <div className="flex justify-between">
          <div className="flex items-center justify-center gap-1 text-sm">
            <Tag className="size-3" />
            {template.sessions.length} sessions
          </div>
          <div className="flex items-center justify-center gap-1 text-sm">
            <Clock className="size-3" />
            {formatTime(totalSessionDuration)} total
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="size-3" />
          <div className="text-sm text-muted-foreground">
            {format(template.start_date, "dd. MMM HH:mm")} -{" "}
            {format(template.end_date, "dd. MMM HH:mm ")}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {template.sessions.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Sessions:
            </h4>
            <div className="space-y-2">
              {sessionTimes.map((session, index) => {
                return (
                  <RecurringSessionCard
                    session={{
                      ...session,
                      id: index.toString(),
                    }}
                    key={index}
                    template={template}
                  />
                );
              })}
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
