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
import { useForm } from "react-hook-form";
import {
  addHours,
  addMinutes,
  isBefore,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns";
import { FC, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";

import {
  ScheduledSessionWithId,
  ScheduledSessionWithIdSchema,
} from "@/api/definitions";
import { cn } from "@/lib/utils";
import { ArrowBigRight } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardFooter } from "@/components/shadcn/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { Input } from "@/components/shadcn/input";
import {
  DateTimePicker,
  QuickOption,
} from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { ScheduledSessionRequest } from "@/api/definitions";
import { DurationLabel } from "@/components/visualizers/sessions/ScheduledSessionCreationForm";
import { useDeleteScheduledSession } from "@/components/hooks/session/fixed/useDeleteSession";

const creationFormQuickOptions: QuickOption[] = [
  {
    label: "now",
    increment: () => new Date(),
  },
  {
    label: "clamp",
    increment: (date) => setMinutes(date, 0),
  },
  {
    label: "+ 15m",
    increment: (date) => addMinutes(date, 15),
  },
  {
    label: "- 15m",
    increment: (date) => subMinutes(date, 15),
  },
  {
    label: "+ 1h",
    increment: (date) => addHours(date, 1),
  },
  {
    label: "- 1h",
    increment: (date) => subHours(date, 1),
  },
];

type EditStopwatchSessionProps = {
  session: ScheduledSessionWithId;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
};

export const EditScheduledSession: FC<EditStopwatchSessionProps> = (props) => {
  const form = useForm<ScheduledSessionWithId>({
    resolver: zodResolver(ScheduledSessionWithIdSchema),
    defaultValues: { ...props.session },
  });

  const updateSession = useUpdateSession("scheduled");
  const deleteSession = useDeleteScheduledSession();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  async function onSubmit(values: ScheduledSessionWithId) {
    if (
      values.endTime &&
      values.startTime &&
      isBefore(values.endTime, values.startTime)
    ) {
      form.setError("startTime", {
        message: "Start time must be before end time",
      });
      return;
    }
    if (props.onSave) {
      props.onSave();
    }

    const data: ScheduledSessionRequest["update"] = {
      id: values.id,
      startTime: values.startTime,
      endTime: values.endTime,
      category_id: values.category.id,
      description: values.description,
      tag_ids: values.tags.map((tag) => tag.id),
    };

    await updateSession.mutateAsync(data);
  }

  return (
    <Card className={cn("border-0")}>
      <CardContent className="mt-3">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, console.log)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <SingleCategoryPicker
                      value={field.value ?? undefined}
                      onSelectedCategoriesChanged={(category) =>
                        field.onChange(category)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Insert your description"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <FormField
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        quickOptions={creationFormQuickOptions}
                        selected={field.value || undefined}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col items-center justify-center">
                <DurationLabel
                  from={form.watch("startTime")}
                  to={form.watch("endTime")}
                />
                <ArrowBigRight />
              </div>

              <FormField
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">End Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        quickOptions={creationFormQuickOptions}
                        selected={field.value}
                        onSelect={(val) => {
                          if (val) {
                            field.onChange(val);
                          } else {
                            form.resetField("endTime");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="tags"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      selectedTags={
                        field.value?.map((t) => ({
                          ...t,
                          usages: 0,
                          allowedCategories: [],
                        })) ?? []
                      }
                      forCategory={form.watch("category") ?? undefined}
                      disabled={form.getValues("category") === undefined}
                      onNewTagsSelected={(tags) => field.onChange(tags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                type="button"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                Delete
              </Button>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={props.onCancel}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
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
              onClick={async () =>
                await deleteSession.mutateAsync(props.session.id, {
                  onSuccess: () => {
                    if (props.onDelete) {
                      props.onDelete();
                    }

                    setIsDeleteAlertOpen(false);
                  },
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
