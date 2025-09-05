import { FC, useState, useEffect } from "react";
import {
  CategoryWithId,
  TagWithId,
  CategoryRequest,
  CategoryResponse,
} from "@/api/definitions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { CalendarIcon, ArrowRight } from "lucide-react";

import * as categoryApi from "@/api/categoryApi";
import * as tagApi from "@/api/tagApi";
import { formatDistanceToNow } from "date-fns";
import { TagApi } from "@/api";

const MigrationFormSchema = z.object({
  fromCategoryId: z.string().uuid("Please select a source category"),
  targetCategoryId: z.string().uuid("Please select a target category"),
  tagIds: z.array(z.string().uuid()).optional(),
  fromStartTime: z.string().optional(),
  toEndTime: z.string().optional(),
});

type MigrationFormData = z.infer<typeof MigrationFormSchema>;

interface CategoryMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrationComplete?: (affectedCount: number) => void;
}

export const CategoryMigrationDialog: FC<CategoryMigrationDialogProps> = ({
  open,
  onOpenChange,
  onMigrationComplete,
}) => {
  const [preview, setPreview] = useState<
    CategoryResponse["migratePreview"] | null
  >(null);

  const form = useForm<MigrationFormData>({
    resolver: zodResolver(MigrationFormSchema),
    defaultValues: {
      tagIds: [],
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => await TagApi.readMany(),
  });

  const previewMutation = useMutation({
    mutationFn: categoryApi.getMigrationPreview,
    onSuccess: (data) => setPreview(data),
    onError: () => setPreview(null),
  });

  const migrationMutation = useMutation({
    mutationFn: categoryApi.migrateCategory,
    onSuccess: (affectedCount) => {
      onMigrationComplete?.(affectedCount);
      onOpenChange(false);
      form.reset();
      setPreview(null);
    },
  });

  const watchedValues = form.watch();

  // Auto-refresh preview when form values change
  useEffect(() => {
    const {
      fromCategoryId,
      targetCategoryId,
      tagIds,
      fromStartTime,
      toEndTime,
    } = watchedValues;

    if (
      fromCategoryId &&
      targetCategoryId &&
      fromCategoryId !== targetCategoryId
    ) {
      const filters: CategoryRequest["migratePreview"]["filters"] = {};

      if (tagIds?.length) filters.tag_ids = tagIds;
      if (fromStartTime) filters.from_start_time = fromStartTime;
      if (toEndTime) filters.to_end_time = toEndTime;

      previewMutation.mutate({
        from_category_id: fromCategoryId,
        target_category_id: targetCategoryId,
        filters,
      });
    } else {
      setPreview(null);
    }
  }, [
    watchedValues.fromCategoryId,
    watchedValues.targetCategoryId,
    watchedValues.tagIds,
    watchedValues.fromStartTime,
    watchedValues.toEndTime,
  ]);

  const onSubmit = (data: MigrationFormData) => {
    const filters: CategoryRequest["migrate"]["filters"] = {};

    if (data.tagIds?.length) filters.tag_ids = data.tagIds;
    if (data.fromStartTime) filters.from_start_time = data.fromStartTime;
    if (data.toEndTime) filters.to_end_time = data.toEndTime;

    migrationMutation.mutate({
      from_category_id: data.fromCategoryId,
      target_category_id: data.targetCategoryId,
      filters,
    });
  };

  const fromCategory = categories.find(
    (c) => c.id === watchedValues.fromCategoryId,
  );
  const targetCategory = categories.find(
    (c) => c.id === watchedValues.targetCategoryId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migrate Category</DialogTitle>
          <DialogDescription>
            Move sessions from one category to another. This will update all
            matching sessions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
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
                name="targetCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter((c) => c.id !== watchedValues.fromCategoryId)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Migration Preview */}
            {fromCategory && targetCategory && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fromCategory.color }}
                    />
                    {fromCategory.name}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant="outline" className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: targetCategory.color }}
                    />
                    {targetCategory.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Filters (Optional)</h4>

              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Only sessions with tags</FormLabel>
                    <FormDescription>
                      Only migrate sessions that have at least one of these tags
                    </FormDescription>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={
                            field.value?.includes(tag.id)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const current = field.value || [];
                            const updated = current.includes(tag.id)
                              ? current.filter((id) => id !== tag.id)
                              : [...current, tag.id];
                            field.onChange(updated);
                          }}
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preview Results */}
            {preview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Preview: {preview.affected_sessions_count} sessions will be
                    migrated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {preview.session_previews.length > 0 ? (
                    <div className="space-y-2">
                      {preview.session_previews.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <div className="font-medium">
                              {session.description || "No description"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDistanceToNow(
                                new Date(session.start_time),
                                { addSuffix: true },
                              )}
                              {session.current_tag_names && (
                                <span>
                                  {" "}
                                  • Tags: {session.current_tag_names}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {preview.affected_sessions_count >
                        preview.session_previews.length && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... and{" "}
                          {preview.affected_sessions_count -
                            preview.session_previews.length}{" "}
                          more sessions
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No sessions match the current filters
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !preview ||
                  preview.affected_sessions_count === 0 ||
                  migrationMutation.isPending
                }
              >
                {migrationMutation.isPending
                  ? "Migrating..."
                  : `Migrate ${preview?.affected_sessions_count || 0} Sessions`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
