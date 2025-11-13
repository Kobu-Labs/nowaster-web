"use client";

import { useCreateProject } from "@/components/hooks/project/useCreateProject";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CreateProjectDialogProps = {
  onSuccess?: () => void;
};

const createProjectSchema = z.object({
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  name: z.string().min(1, "Name is required").trim(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export const CreateProjectDialog: FC<CreateProjectDialogProps> = ({
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();

  const form = useForm<CreateProjectForm>({
    defaultValues: {
      color: "#EC4899",
      description: "",
      imageUrl: "",
      name: "",
    },
    resolver: zodResolver(createProjectSchema),
  });

  const onSubmit = (values: CreateProjectForm) => {
    createProject.mutate(
      {
        color: values.color,
        description: values.description?.trim() || undefined,
        imageUrl: values.imageUrl?.trim() || undefined,
        name: values.name,
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog modal={false} onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your tasks and sessions.
          </DialogDescription>
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
                  setOpen(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={createProject.isPending}
                loading={createProject.isPending}
                type="submit"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
