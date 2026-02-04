"use client";

import {
  useRelease,
  useUpdateRelease,
} from "@/components/hooks/release/useReleases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UpdateReleaseRequest } from "@/api/definitions/requests/release";
import { useToast } from "@/components/shadcn/use-toast";
import type { FC } from "react";
import { z } from "zod";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  releaseId: string;
};

const formSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_title: z.string().optional(),
  short_description: z.string().optional(),
  tags: z.string().optional(),
  version: z.string().min(1).max(50).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const EditReleaseDialog: FC<Props> = ({
  onOpenChange,
  open,
  releaseId,
}) => {
  const { data: release, isLoading } = useRelease(releaseId);
  const updateRelease = useUpdateRelease();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: release
      ? {
          name: release.name,
          seo_description: release.seo_description ?? "",
          seo_keywords: release.seo_keywords ?? "",
          seo_title: release.seo_title ?? "",
          short_description: release.short_description ?? "",
          tags: release.tags.join(", "),
          version: release.version,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    if (!release) {
      return;
    }

    try {
      const request: UpdateReleaseRequest = {
        name: values.name,
        seo_description: values.seo_description,
        seo_keywords: values.seo_keywords,
        seo_title: values.seo_title,
        short_description: values.short_description,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        version: values.version,
      };

      await updateRelease.mutateAsync({
        releaseId,
        request,
      });

      toast({
        description: `${values.name} has been updated successfully.`,
        title: "Release updated",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unknown error",
        title: "Error updating release",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !release) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <div>Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Release</DialogTitle>
          <DialogDescription>Update the release information.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version*</FormLabel>
                  <FormControl>
                    <Input placeholder="v1.0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="First Release" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this release..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="feature, bugfix, performance"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Title</FormLabel>
                  <FormControl>
                    <Input placeholder="SEO optimized title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="SEO meta description..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Keywords</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="keyword1, keyword2, keyword3"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={updateRelease.isPending} type="submit">
                {updateRelease.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
