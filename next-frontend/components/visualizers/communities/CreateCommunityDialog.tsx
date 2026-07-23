"use client";

import { useCreateCommunity } from "@/components/hooks/community/useCreateCommunity";
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
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Textarea } from "@/components/shadcn/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CreateCommunityDialogProps = {
  onSuccess?: () => void;
};

const createCommunitySchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name must be 80 characters or fewer").trim(),
  description: z.string().max(2000).optional(),
  visibilityType: z.enum(["public", "invite_only"]),
  dataVisibility: z.enum(["public", "members_only"]),
});

type CreateCommunityForm = z.infer<typeof createCommunitySchema>;

export const CreateCommunityDialog: FC<CreateCommunityDialogProps> = ({
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const createCommunity = useCreateCommunity();

  const form = useForm<CreateCommunityForm>({
    defaultValues: {
      name: "",
      description: "",
      visibilityType: "invite_only",
      dataVisibility: "members_only",
    },
    resolver: zodResolver(createCommunitySchema),
  });

  const onSubmit = (values: CreateCommunityForm) => {
    createCommunity.mutate(
      {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : undefined,
        visibilityType: values.visibilityType,
        dataVisibility: values.dataVisibility,
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
          New Community
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
          <DialogDescription>
            Track time together with people learning or working on the same
            things.
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
                    <Input {...field} placeholder="Community name..." />
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
                      placeholder="Community description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex gap-4"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="visibility-invite" value="invite_only" />
                        <Label htmlFor="visibility-invite">Invite only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="visibility-public" value="public" />
                        <Label htmlFor="visibility-public">Public</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataVisibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex gap-4"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="data-visibility-members" value="members_only" />
                        <Label htmlFor="data-visibility-members">Members only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="data-visibility-public" value="public" />
                        <Label htmlFor="data-visibility-public">Public</Label>
                      </div>
                    </RadioGroup>
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
                disabled={createCommunity.isPending}
                loading={createCommunity.isPending}
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
