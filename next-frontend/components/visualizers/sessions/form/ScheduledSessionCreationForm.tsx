import {
  CategoryWithIdSchema,
  ScheduledSessionRequest,
} from "@/api/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, isBefore, isEqual } from "date-fns";
import { ArrowBigRight } from "lucide-react";
import { FC } from "react";
import { useForm } from "react-hook-form";

import { useCreateScheduledSession } from "@/components/hooks/session/fixed/useCreateSession";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardFooter } from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { dateQuickOptions } from "@/components/ui-providers/date-pickers/QuickOptions";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { formatTime } from "@/lib/utils";
import { SessionPrecursor } from "@/validation/session/creation";
import { z } from "zod";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";

export const DurationLabel: FC<{ from?: Date; to?: Date }> = (props) => {
  if (!props.from || !props.to) {
    return <span>--:--</span>;
  }

  const duration = differenceInMinutes(props.to, props.from);
  if (duration < 0) {
    return <span>--:--</span>;
  }

  const formatted = formatTime(duration);
  return <span>{formatted}</span>;
};

type ScheduledSessionCreationFormProps = {
  precursor?: SessionPrecursor;
  onCreate?: () => void;
  onClose?: () => void;
  onCreateAndClose?: () => void;
};

const createSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
    }),
  ),
});

export const ScheduledSessionCreationForm: FC<
  ScheduledSessionCreationFormProps
> = (props) => {
  const form = useForm<z.infer<typeof createSessionPrecursor>>({
    resolver: zodResolver(createSessionPrecursor),
    defaultValues: props.precursor,
  });

  const createSession = useCreateScheduledSession();

  async function onSubmit(values: z.infer<typeof createSessionPrecursor>) {
    if (
      isBefore(values.endTime, values.startTime) ||
      isEqual(values.endTime, values.startTime)
    ) {
      form.setError("endTime", {
        message: "End time must be after start time",
      });
      return;
    }

    const data: ScheduledSessionRequest["create"] = {
      startTime: values.startTime,
      endTime: values.endTime,
      description: values.description,
      category_id: values.category.id,
      tag_ids: values.tags.map((tag) => tag.id),
    };

    await createSession.mutateAsync(data, {
      onSuccess: () => {
        if (props.onCreate) {
          props.onCreate();
        }
      },
    });
  }

  return (
    <Card>
      <CardContent className="mt-3 ">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      mode="single"
                      selectedCategory={field.value ?? null}
                      onSelectCategory={(cat) => {
                        if (cat.id === field.value?.id) {
                          form.resetField("category");
                        } else {
                          field.onChange(cat);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              defaultValue={null}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Insert your description"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <FormField
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        quickOptions={dateQuickOptions}
                        selected={field.value || undefined}
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
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">End Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        quickOptions={dateQuickOptions}
                        selected={field.value}
                        onSelect={(val) => {
                          if (val) {
                            field.onChange(val);
                          } else {
                            form.resetField("endTime");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              defaultValue={[]}
              name="tags"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      forCategory={form.watch("category")}
                      disabled={form.getValues("category") === undefined}
                      onNewTagsSelected={(tags) => field.onChange(tags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="justify-between p-0">
              {props.onClose && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={props.onClose}
                >
                  Close
                </Button>
              )}
              <div className="grow"></div>
              <div className="flex items-center gap-2">
                <Button type="submit" loading={createSession.isPending}>
                  Submit
                </Button>
                {props.onCreateAndClose && (
                  <Button
                    type="submit"
                    loading={createSession.isPending}
                    onClick={props.onCreateAndClose}
                  >
                    Submit and Close
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
