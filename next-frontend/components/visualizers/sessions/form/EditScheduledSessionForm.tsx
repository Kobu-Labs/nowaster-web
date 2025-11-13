"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { isBefore } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type {
  ScheduledSessionRequest,
  ScheduledSessionWithId,
} from "@/api/definitions";
import { CategoryWithIdSchema } from "@/api/definitions";
import { useDeleteScheduledSession } from "@/components/hooks/session/fixed/useDeleteSession";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardFooter } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { dateQuickOptions } from "@/components/ui-providers/date-pickers/QuickOptions";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { ProjectPicker } from "@/components/visualizers/projects/ProjectPicker";
import { DurationLabel } from "@/components/visualizers/sessions/form/ScheduledSessionCreationForm";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { TaskPicker } from "@/components/visualizers/tasks/TaskPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigDown } from "lucide-react";
import z from "zod";

type EditStopwatchSessionProps = {
  onCancel?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  session: ScheduledSessionWithId;
};

const editSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  endTime: z.coerce.date<Date>("Please select an end time"),
  id: z.string(),
  projectId: z.string().nullish(),
  startTime: z.coerce.date<Date>("Please select a start time"),
  tags: z.array(
    z.object({
      id: z.uuid(),
    }),
  ),
  taskId: z.string().nullish(),
});

type EditSessionPrecursor = z.infer<typeof editSessionPrecursor>;

export const EditScheduledSession: FC<EditStopwatchSessionProps> = (props) => {
  const form = useForm<EditSessionPrecursor>({
    defaultValues: { ...props.session },
    resolver: zodResolver(editSessionPrecursor),
  });

  const updateSession = useUpdateSession("scheduled");
  const deleteSession = useDeleteScheduledSession();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  async function onSubmit(values: EditSessionPrecursor) {
    if (isBefore(values.endTime, values.startTime)) {
      form.setError("startTime", {
        message: "Start time must be before end time",
      });
      return;
    }

    const data: ScheduledSessionRequest["update"] = {
      category_id: values.category.id,
      description: values.description,
      endTime: values.endTime,
      id: values.id,
      projectId: values.projectId,
      startTime: values.startTime,
      tag_ids: values.tags.map((tag) => tag.id),
      taskId: values.taskId,
    };

    await updateSession.mutateAsync(data, {
      onSuccess: props.onSave,
    });
  }

  return (
    <Card className="border-0 p-0 m-0">
      <CardContent className="mt-3 max-w-full overflow-hidden p-2 md:p-6">
        <Form {...form}>
          <form
            className="space-y-6 md:space-y-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      mode="single"
                      onSelectCategory={(cat) => {
                        if (cat.id === field.value?.id) {
                          form.resetField("category");
                        } else {
                          field.onChange(cat);
                        }
                      }}
                      selectedCategory={field.value ?? null}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 flex-1">
                    <FormLabel>Project (Optional)</FormLabel>
                    <FormControl>
                      <ProjectPicker
                        onSelectProject={(project) => {
                          field.onChange(project?.id ?? null);
                          // deselected project or switched to a different one
                          if (!project || project.id !== field.value) {
                            form.setValue("taskId", null);
                          }
                        }}
                        selectedProjectId={field.value ?? null}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("projectId")
                ? (
                    <FormField
                      control={form.control}
                      name="taskId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2 flex-1">
                          <FormLabel>Task (Optional)</FormLabel>
                          <FormControl>
                            <TaskPicker
                              onSelectTask={(task) => {
                                field.onChange(task?.id);
                              }}
                              projectId={form.watch("projectId") ?? null}
                              selectedTaskId={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                : (
                    <FormItem className="flex flex-col gap-2 flex-1">
                      <FormLabel>Task (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center h-10 px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground">
                          Select a project first
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      onChange={field.onChange}
                      placeholder="Insert your description"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onSelect={(val) => {
                          if (val) {
                            field.onChange(val);
                            if (!form.getValues("endTime")) {
                              form.setValue("endTime", val);
                            }
                          } else {
                            form.resetField("startTime");
                          }
                        }}
                        quickOptions={dateQuickOptions}
                        selected={field.value || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-row items-center justify-center gap-2 py-2 md:flex-col md:gap-0 md:py-0">
                <DurationLabel
                  from={form.watch("startTime")}
                  to={form.watch("endTime")}
                />
                <ArrowBigDown className="md:-rotate-90" />
              </div>

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">End Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onSelect={(val) => {
                          if (val) {
                            field.onChange(val);
                          } else {
                            form.resetField("endTime");
                          }
                        }}
                        quickOptions={dateQuickOptions}
                        selected={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      disabled={form.getValues("category") === undefined}
                      forCategory={form.watch("category") ?? undefined}
                      onNewTagsSelected={(tags) => {
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-between px-0">
              <Button
                onClick={() => {
                  setIsDeleteAlertOpen(true);
                }}
                type="button"
                variant="destructive"
              >
                Delete
              </Button>

              <div>
                <Button
                  className="mr-2"
                  onClick={props.onCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
      <AlertDialog onOpenChange={setIsDeleteAlertOpen} open={isDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () =>
                await deleteSession.mutateAsync(props.session.id, {
                  onSuccess: () => {
                    if (props.onDelete) {
                      props.onDelete();
                    }

                    setIsDeleteAlertOpen(false);
                  },
                })}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
