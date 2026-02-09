"use client";

import {
  useAllReleases,
  useCreateRelease,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Badge } from "@/components/shadcn/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateReleaseRequest } from "@/api/definitions/requests/release";
import { useToast } from "@/components/shadcn/use-toast";
import type { FC } from "react";
import { z } from "zod";
import { getAvailableReleaseVersions } from "@/lib/releaseRegistry";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_title: z.string().optional(),
  short_description: z.string().optional(),
  tags: z.string().optional(),
  version: z.string().min(1, "Version is required").max(50),
});

type FormValues = z.infer<typeof formSchema>;

export const CreateReleaseDialog: FC<Props> = ({ onOpenChange, open }) => {
  const createRelease = useCreateRelease();
  const { data: existingReleases } = useAllReleases();
  const { toast } = useToast();

  const availableVersions = getAvailableReleaseVersions();

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      seo_description: "",
      seo_keywords: "",
      seo_title: "",
      short_description: "",
      tags: "",
      version: "",
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const request: CreateReleaseRequest = {
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

      await createRelease.mutateAsync(request);

      toast({
        description: `${values.name} (${values.version}) has been created successfully.`,
        title: "Release created",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unknown error",
        title: "Error creating release",
        variant: "destructive",
      });
    }
  };
  if (!existingReleases) {
    return null;
  }

  const readyVersions = availableVersions.filter((version) => {
    return !existingReleases.find((rel) => rel.version === version);
  });

  const pendingReleases = existingReleases.filter((rel) => {
    return availableVersions.includes(rel.version) && !rel.released;
  });

  const releasedVersions = existingReleases.filter((rel) => {
    return availableVersions.includes(rel.version) && rel.released;
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Release</DialogTitle>
          <DialogDescription>
            Create a new release entry. You can publish it later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a version" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {readyVersions.map((version) => (
                        <SelectItem key={version} value={version}>
                          <div className="flex items-center gap-2">
                            <span>[{version}]</span>
                            <Badge
                              className="ml-2 bg-green-500/10 text-green-500"
                              variant="outline"
                            >
                              Ready
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}

                      {pendingReleases.map((release) => (
                        <SelectItem
                          key={release.version}
                          value={release.version}
                          disabled
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              [{release.version}]: {release.name}
                            </span>
                            <Badge
                              className="ml-2 bg-yellow-500/10 text-yellow-600"
                              variant="outline"
                            >
                              Pending
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}

                      {releasedVersions.map((release) => (
                        <SelectItem
                          key={release.version}
                          value={release.version}
                          disabled
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              [{release.version}]: {release.name}
                            </span>
                            <Badge
                              className="ml-2 bg-blue-500/10 text-blue-600"
                              variant="outline"
                            >
                              Released
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button disabled={createRelease.isPending} type="submit">
                {createRelease.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
