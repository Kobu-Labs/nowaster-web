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
import type { FC} from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type {
  ScheduledSessionRequest,
  ScheduledSessionWithId} from "@/api/definitions";
import {
  ScheduledSessionWithIdSchema,
} from "@/api/definitions";
import { useDeleteScheduledSession } from "@/components/hooks/session/fixed/useDeleteSession";
import { useUpdateSession } from "@/components/hooks/session/useUpdateSession";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardFooter } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { dateQuickOptions } from "@/components/ui-providers/date-pickers/QuickOptions";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { DurationLabel } from "@/components/visualizers/sessions/form/ScheduledSessionCreationForm";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight } from "lucide-react";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";

interface EditStopwatchSessionProps {
  onCancel?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  session: ScheduledSessionWithId;
}

export const EditScheduledSession: FC<EditStopwatchSessionProps> = (props) => {
  const form = useForm<ScheduledSessionWithId>({
    defaultValues: { ...props.session },
    resolver: zodResolver(ScheduledSessionWithIdSchema),
  });

  const updateSession = useUpdateSession("scheduled");
  const deleteSession = useDeleteScheduledSession();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  async function onSubmit(values: ScheduledSessionWithId) {
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
      startTime: values.startTime,
      tag_ids: values.tags.map((tag) => tag.id),
    };

    await updateSession.mutateAsync(data, {
      onSuccess: props.onSave,
    });
  }

  return (
    <Card className={cn("border-0")}>
      <CardContent className="mt-3">
        <Form {...form}>
          <form
            className="space-y-8"
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
                      onSelectCategory={field.onChange}
                      selectedCategory={field.value ?? null}
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
                      onChange={field.onChange}
                      placeholder="Insert your description"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
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

              <div className="flex flex-col items-center justify-center">
                <DurationLabel
                  from={form.watch("startTime")}
                  to={form.watch("endTime")}
                />
                <ArrowBigRight />
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
                      onNewTagsSelected={(tags) => { field.onChange(tags); }}
                      selectedTags={
                        field.value?.map((t) => ({
                          ...t,
                          allowedCategories: [],
                          last_used_at: new Date(),
                          usages: 0,
                        })) ?? []
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-between">
              <Button
                onClick={() => { setIsDeleteAlertOpen(true); }}
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
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
