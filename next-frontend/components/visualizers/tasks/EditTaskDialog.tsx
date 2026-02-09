"use client";

import type { TaskWithId } from "@/api/definitions/models/task";
import { useUpdateTask } from "@/components/hooks/task/useUpdateTask";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type EditTaskDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
  task: TaskWithId;
};

const editTaskSchema = z.object({
  description: z.string().optional(),
  name: z.string().min(1, "Name is required").trim(),
});

type EditTaskForm = z.infer<typeof editTaskSchema>;

export const EditTaskDialog: FC<EditTaskDialogProps> = ({
  onOpenChange,
  onSuccess,
  open,
  task,
}) => {
  const updateTask = useUpdateTask();

  const form = useForm<EditTaskForm>({
    defaultValues: {
      description: task?.description ?? undefined,
      name: task?.name,
    },
    resolver: zodResolver(editTaskSchema),
  });

  const onSubmit = (values: EditTaskForm) => {
    updateTask.mutate(
      {
        completed: task.completed,
        description: values.description?.trim() ? values.description.trim() : undefined,
        id: task.id,
        name: values.name,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Task name..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="resize-none"
                      placeholder="Task description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={updateTask.isPending}
                loading={updateTask.isPending}
                type="submit"
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
