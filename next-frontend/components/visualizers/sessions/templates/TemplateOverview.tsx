import { SessionTemplateApi } from "@/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
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
import { CreateTemplateFormDialog } from "@/components/visualizers/sessions/templates/form/TemplateForm";
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
  MoreHorizontal,
  Tag,
  Trash,
  Trash2,
} from "lucide-react";
import { FC, useMemo, useState } from "react";
import { TemplateSessionsAction } from "@/components/visualizers/sessions/templates/form/form-schemas";

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
    mutationFn: async (action: TemplateSessionsAction) => {
      await SessionTemplateApi.deleteTemplate({
        id: template.id,
        existingSessionActions: action,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session-templates"] });
    },
  });

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);

  return (
    <>
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
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={() => setIsDuplicateOpen(true)}
                  >
                    <CopyIcon className="p-1" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <DeleteTemplateAlertDialog
                      template={template}
                      onConfirm={handleDeleteTemplate.mutate}
                      onCancel={console.log}
                    />
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

const DeleteTemplateAlertDialog: FC<{
  template: SessionTemplate;
  onConfirm: (action: TemplateSessionsAction) => void;
  onCancel: () => void;
}> = (props) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="text-destructive flex items-center gap-2">
        <Trash className="p-1" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete Template "{props.template.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-4">
            <p>
              This template has associated sessions. What would you like to do
              with them?
            </p>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Keep sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Only remove template, keep all sessions
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => props.onConfirm("keep-all")}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-24"
                >
                  Keep
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      Delete future sessions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remove template and upcoming sessions only
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => props.onConfirm("delete-future")}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-24"
                >
                  Delete Future
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      Delete all sessions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove template and all sessions
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => props.onConfirm("delete-all")}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-24"
                >
                  Delete All
                </Button>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.onCancel} className="w-full">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
