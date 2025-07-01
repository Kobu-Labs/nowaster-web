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
import {
  CreateTemplateFormDialog,
  EditTemplateFormDialog,
} from "@/components/visualizers/sessions/templates/form/TemplateForm";
import { RecurringSessionCard } from "@/components/visualizers/sessions/templates/RecurringSessionCard";
import { TemplateIntervalBadge } from "@/components/visualizers/sessions/templates/TemplateIntervalBadge";
import { getDaytimeAfterDate } from "@/lib/date-utils";
import { formatTime } from "@/lib/utils";
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
import { FC, useMemo, useState } from "react";

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

type TemplateOverviewProps = {
  template: SessionTemplate;
};

export const TemplateOverview: FC<TemplateOverviewProps> = ({ template }) => {
  // INFO: Calculate session times based on the template and todays date, only future session dates are shown
  const sessionTimes = useMemo(
    () =>
      template.sessions
        .map((session) => calculateClosestSession(session, template))
        // show the closest upcoming sessions first
        .sort(
          (a, b) => a.closestStartTime.getTime() - b.closestStartTime.getTime(),
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);

  return (
    <>
      <EditTemplateFormDialog
        template={template}
        open={isEditOpen}
        setIsOpen={setIsEditOpen}
      />
      <CreateTemplateFormDialog
        open={isDuplicateOpen}
        setIsOpen={setIsDuplicateOpen}
        defaultValues={{ ...template, name: template.name + " - duplicated" }}
      />
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
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={() => setIsEditOpen(true)}
                  >
                    <EditIcon className="p-1" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={() => setIsDuplicateOpen(true)}
                  >
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
                {sessionTimes.map((session, index) => (
                  <RecurringSessionCard
                    session={{
                      ...session,
                      id: index.toString(),
                    }}
                    key={index}
                    template={template}
                  />
                ))}
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
    </>
  );
};
