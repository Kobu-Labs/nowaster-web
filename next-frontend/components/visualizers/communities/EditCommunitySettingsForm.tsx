"use client";

import type { CommunityWithId } from "@/api/definitions";
import { useUpdateCommunity } from "@/components/hooks/community/useUpdateCommunity";
import { Button } from "@/components/shadcn/button";
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
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type EditCommunitySettingsFormProps = {
  community: CommunityWithId;
  onSaved?: () => void;
};

const editCommunitySchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name must be 80 characters or fewer").trim(),
  description: z.string().max(2000).optional(),
  visibilityType: z.enum(["public", "invite_only"]),
  dataVisibility: z.enum(["public", "members_only"]),
});

type EditCommunityForm = z.infer<typeof editCommunitySchema>;

export const EditCommunitySettingsForm: FC<EditCommunitySettingsFormProps> = ({
  community,
  onSaved,
}) => {
  const updateCommunity = useUpdateCommunity();

  const form = useForm<EditCommunityForm>({
    defaultValues: {
      name: community.name,
      description: community.description ?? "",
      visibilityType: community.visibility_type,
      dataVisibility: community.data_visibility,
    },
    resolver: zodResolver(editCommunitySchema),
  });

  const onSubmit = (values: EditCommunityForm) => {
    updateCommunity.mutate(
      {
        id: community.id,
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : undefined,
        visibilityType: values.visibilityType,
        dataVisibility: values.dataVisibility,
      },
      {
        onSuccess: () => {
          onSaved?.();
        },
      },
    );
  };

  return (
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
                    <RadioGroupItem id="edit-visibility-invite" value="invite_only" />
                    <Label htmlFor="edit-visibility-invite">Invite only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="edit-visibility-public" value="public" />
                    <Label htmlFor="edit-visibility-public">Public</Label>
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
                    <RadioGroupItem id="edit-data-visibility-members" value="members_only" />
                    <Label htmlFor="edit-data-visibility-members">Members only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="edit-data-visibility-public" value="public" />
                    <Label htmlFor="edit-data-visibility-public">Public</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            disabled={updateCommunity.isPending}
            loading={updateCommunity.isPending}
            type="submit"
          >
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
