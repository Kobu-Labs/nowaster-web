import { SessionTemplateApi } from "@/api";
import {
  AlertDialog,
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
  Trash,
  Trash2,
  PlayCircle,
  Users,
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

  const closestStartTime = getDaytimeAfterDate(
    max([startTime, new Date()]),
    template.interval,
    {
      day: startTime.getDay(),
      hours: startTime.getHours(),
      minutes: startTime.getMinutes(),
    },
  );

  const closestEndTime = addMinutes(
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
      <Card className="group overflow-hidden transition-all duration-400 shadow-md hover:shadow-xl">
        <CardHeader className="pb-4 relative">
          <div className="flex items-start justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-2 h-12 gradient-accent-bar rounded-full" />
              <div>
                <CardTitle className="text-lg font-semibold gradient-text-hover">
                  {template.name}
                </CardTitle>
                <TemplateIntervalBadge interval={template.interval} />
              </div>
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={() => setIsDuplicateOpen(true)}
                >
                  <CopyIcon className="w-4 h-4" />
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

          {/* Stats row */}
          <div className="ml-5 grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 gradient-container-subtle rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-pink-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {template.sessions.length}
                </div>
                <div className="text-xs">Sessions</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 gradient-container-subtle rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {formatTime(totalSessionDuration)}
                </div>
                <div className="text-xs">Duration</div>
              </div>
            </div>
          </div>

          {/* Date range */}
          <div className="ml-5 flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-pink-muted">
            <Calendar className="w-3 h-3" />
            <span>
              {format(template.start_date, "MMM dd, yyyy")} -{" "}
              {format(template.end_date, "MMM dd, yyyy")}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {template.sessions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PlayCircle className="w-4 h-4 text-pink-primary" />
                Upcoming Sessions
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessionTimes.slice(0, 3).map((session, index) => (
                  <div key={index} className="border rounded-lg">
                    <RecurringSessionCard
                      session={{
                        ...session,
                        id: index.toString(),
                      }}
                      template={template}
                    />
                  </div>
                ))}
                {sessionTimes.length > 3 && (
                  <div className="text-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-pink-primary hover:text-pink-primary/80 hover:bg-pink-subtle"
                    >
                      +{sessionTimes.length - 3} more sessions
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-12 h-12 gradient-container-subtle rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-pink-primary" />
              </div>
              <p className="text-sm font-medium">No sessions configured</p>
              <p className="text-xs">Edit this template to add sessions</p>
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
            Delete Template &ldquo;{props.template.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-4">
            <p>
              This template has associated sessions. What would you like to do
              with them?
            </p>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-linear-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 rounded-lg border border-green-200/30 dark:border-green-800/20">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
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
                  className="w-full sm:w-auto sm:min-w-24 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/20"
                >
                  Keep
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-linear-to-r from-orange-50/50 to-yellow-50/30 dark:from-orange-950/20 dark:to-yellow-950/10 rounded-lg border border-orange-200/30 dark:border-orange-800/20">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-600 dark:text-orange-400">
                      Delete future sessions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remove template and upcoming sessions only
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => props.onConfirm("delete-future")}
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-24 bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0"
                >
                  Delete Future
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-linear-to-r from-red-50/50 to-pink-50/30 dark:from-red-950/20 dark:to-pink-950/10 rounded-lg border border-red-200/30 dark:border-red-800/20">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Delete all sessions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove template and all sessions
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => props.onConfirm("delete-all")}
                  size="sm"
                  className="w-full sm:w-auto sm:min-w-24 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
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
