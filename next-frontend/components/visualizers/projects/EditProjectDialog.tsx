"use client";

import type { ProjectWithId } from "@/api/definitions/models/project";
import { useUpdateProject } from "@/components/hooks/project/useUpdateProject";
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
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type EditProjectDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
  project: ProjectWithId;
};

const editProjectSchema = z.object({
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  description: z.string().optional(),
  name: z.string().min(1, "Name is required").trim(),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

export const EditProjectDialog: FC<EditProjectDialogProps> = ({
  onOpenChange,
  onSuccess,
  open,
  project,
}) => {
  const updateProject = useUpdateProject();

  const form = useForm<EditProjectForm>({
    defaultValues: {
      color: project?.color,
      description: project?.description ?? undefined,
      name: project?.name,
    },
    resolver: zodResolver(editProjectSchema),
  });

  const onSubmit = (values: EditProjectForm) => {
    if (project) {
      updateProject.mutate(
        {
          color: values.color,
          completed: project.completed,
          description: values.description?.trim() ? values.description.trim() : undefined,
          id: project.id,
          name: values.name,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    }
  };

  return (
    <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project details.</DialogDescription>
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
                    <Input {...field} placeholder="Project name..." />
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
                      placeholder="Project description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      initialColor={field.value}
                      onSelect={field.onChange}
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
                disabled={updateProject.isPending}
                loading={updateProject.isPending}
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
