import {
  CategoryWithIdSchema,
  TagDetailsSchema,
  TagRequest,
} from "@/api/definitions";
import { useToast } from "@/components/shadcn/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Switch } from "@/components/shadcn/switch";

import { TagApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { DataTable } from "@/components/ui-providers/DataTable";
import { QuickOption } from "@/components/ui-providers/date-pickers/QuickOptions";
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  addDays,
  addHours,
  addMonths,
  addYears,
  subDays,
  subHours,
  subMonths,
  subYears,
} from "date-fns";

const MigrationFormPrecursorSchema = z.object({
  fromTag: TagDetailsSchema,
  targetTag: TagDetailsSchema.optional(),
  removeTag: z.boolean().default(false),
  categories: z.array(CategoryWithIdSchema).optional(),
  fromStartTime: z.coerce.date().optional(),
  toEndTime: z.coerce.date().optional(),
});

const dateOpts: QuickOption[] = [
  { increment: (date) => addYears(date, 1), label: "+ 1y" },
  { increment: (date) => subYears(date, 1), label: "- 1y" },
  { increment: (date) => addMonths(date, 1), label: "+ 1m" },
  { increment: (date) => subMonths(date, 1), label: "- 1m" },
  { increment: (date) => addDays(date, 1), label: "+ 1d" },
  { increment: (date) => subDays(date, 1), label: "- 1d" },
  { increment: (date) => addHours(date, 1), label: "+ 1h" },
  { increment: (date) => subHours(date, 1), label: "- 1h" },
] as const;

type MigrationFormData = z.infer<typeof MigrationFormPrecursorSchema>;

type TagMigrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrationComplete?: (affectedCount: number) => void;
};

export const TagMigrationDialog: FC<TagMigrationDialogProps> = ({
  open,
  onOpenChange,
  onMigrationComplete,
}) => {
  const { toast } = useToast();
  const form = useForm<MigrationFormData>({
    resolver: zodResolver(MigrationFormPrecursorSchema),
    defaultValues: {},
  });

  const startDate = form.watch("fromStartTime");
  const endDate = form.watch("toEndTime");

  const filter: SessionFilterPrecursor = {
    settings: {
      tags: {
        id: {
          mode: "some",
        },
      },
      categories: {
        id: {
          mode: "all",
        },
      },
    },
    data: {
      tags: [form.watch("fromTag")],
      categories: form.watch("categories"),
      endTimeFrom: startDate ? { value: startDate } : undefined,
      endTimeTo: endDate ? { value: endDate } : undefined,
    },
  };

  const { data, isPending } = useQuery({
    ...queryKeys.sessions.filtered(filter),
    placeholderData: keepPreviousData,
    enabled: !!form.watch("fromTag"),
  });

  const migrationMutation = useMutation({
    mutationFn: async (data: TagRequest["migrate"]) =>
      await TagApi.migrateTag(data),
    onSuccess: (affectedCount) => {
      const fromTag = form.getValues("fromTag");
      const targetTag = form.getValues("targetTag");
      const removeTag = form.getValues("removeTag");

      toast({
        description: removeTag
          ? `Successfully removed "${fromTag.label}" from ${affectedCount} sessions`
          : `Successfully migrated ${affectedCount} sessions from "${fromTag.label}" to "${targetTag?.label}"`,
      });

      onMigrationComplete?.(affectedCount);
      form.reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: MigrationFormData) => {
    if (!data.removeTag && data.targetTag === undefined) {
      form.setError("targetTag", {
        message: "Either provide target tag or check 'Remove tag'",
      });

      return;
    }
    const filters: TagRequest["migrate"]["filters"] = {};

    if (data.categories?.length)
      filters.category_ids = data.categories.map((cat) => cat.id);
    if (data.fromStartTime) filters.from_start_time = data.fromStartTime;
    if (data.toEndTime) filters.to_end_time = data.toEndTime;

    migrationMutation.mutate({
      from_tag_id: data.fromTag.id,
      target_tag_id: data.targetTag?.id,
      filters,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="w-fit max-w-fit">
        <DialogHeader>
          <DialogTitle>Migrate Tag</DialogTitle>
          <DialogDescription>
            Move sessions from one tag to another, or remove a tag from
            sessions. This will update all matching sessions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fromTag"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>From Tag</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      selectedTags={field.value ? [field.value] : []}
                      onNewTagsSelected={(tags) => field.onChange(tags.at(0))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="removeTag"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Remove tag</FormLabel>
                    <FormDescription>
                      Remove the tag from sessions instead of replacing it with
                      another tag
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              disabled={!!form.watch("removeTag")}
              control={form.control}
              name="targetTag"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>To Tag</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      disabled={!!form.watch("removeTag")}
                      selectedTags={field.value ? [field.value] : []}
                      onNewTagsSelected={(tags) => field.onChange(tags.at(0))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Filters (Optional)</h4>

              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Only sessions in categories</FormLabel>

                    <FormControl>
                      <MultipleCategoryPicker
                        selectedCategories={field.value ?? []}
                        onSelectCategory={(cat) => {
                          if (field.value?.find((cate) => cate.id === cat.id)) {
                            field.onChange(
                              field.value?.filter((cate) => cate.id !== cat.id),
                            );
                          } else {
                            field.onChange([cat, ...(field.value ?? [])]);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Only migrate sessions that belong to one of these
                      categories
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromStartTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>From Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          quickOptions={dateOpts}
                          selected={field.value || undefined}
                          onSelect={(val) => {
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toEndTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>To Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          quickOptions={dateOpts}
                          selected={field.value}
                          onSelect={(val) => {
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={migrationMutation.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <p className="font-bold text-2xl">{`Affected sessions (${data?.length ?? "?"})`}</p>
        <ScrollArea className="h-[30vh]">
          <DataTable
            loading={isPending}
            columns={BaseSessionTableColumns}
            data={data ?? []}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
