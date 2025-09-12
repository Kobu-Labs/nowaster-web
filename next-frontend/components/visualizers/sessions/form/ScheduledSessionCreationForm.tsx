import type { ScheduledSessionRequest } from "@/api/definitions";
import { CategoryWithIdSchema } from "@/api/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, isBefore, isEqual } from "date-fns";
import { ArrowBigDown } from "lucide-react";
import type { FC } from "react";
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
import type { SessionPrecursor } from "@/validation/session/creation";
import { z } from "zod";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";

export const DurationLabel: FC<{ from?: Date; to?: Date; }> = (props) => {
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

interface ScheduledSessionCreationFormProps {
  onClose?: () => void;
  onCreate?: () => void;
  onCreateAndClose?: () => void;
  precursor?: SessionPrecursor;
}

const createSessionPrecursor = z.object({
  category: CategoryWithIdSchema,
  description: z.string().nullable(),
  endTime: z.coerce.date<Date>(),
  startTime: z.coerce.date<Date>(),
  tags: z.array(
    z.object({
      id: z.uuid(),
    }),
  ),
});

export const ScheduledSessionCreationForm: FC<
  ScheduledSessionCreationFormProps
> = (props) => {
  const form = useForm<z.infer<typeof createSessionPrecursor>>({
    defaultValues: props.precursor,
    resolver: zodResolver(createSessionPrecursor),
  });

  const createSession = useCreateScheduledSession();

  async function onSubmit(values: z.infer<typeof createSessionPrecursor>) {
    if (
      isBefore(values.endTime, values.startTime)
      || isEqual(values.endTime, values.startTime)
    ) {
      form.setError("endTime", {
        message: "End time must be after start time",
      });
      return;
    }

    const data: ScheduledSessionRequest["create"] = {
      category_id: values.category.id,
      description: values.description,
      endTime: values.endTime,
      startTime: values.startTime,
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
    <Card className="p-0 m-0">
      <CardContent className="mt-3 max-w-full overflow-hidden p-2 md:p-6">
        <Form {...form}>
          <form
            className="space-y-6 md:space-y-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      mode="single"
                      onSelectCategory={(cat) => {
                        if (cat.id === field.value?.id) {
                          form.resetField("category");
                        } else {
                          field.onChange(cat);
                        }
                      }}
                      selectedCategory={field.value ?? null}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              defaultValue={null}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      onChange={field.onChange}
                      placeholder="Insert your description"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
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
                        quickOptions={dateQuickOptions}
                        selected={field.value || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-row items-center justify-center gap-2 py-2 md:flex-col md:gap-0 md:py-0">
                <DurationLabel
                  from={form.watch("startTime")}
                  to={form.watch("endTime")}
                />
                <ArrowBigDown className="md:-rotate-90" />
              </div>

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="block">End Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onSelect={(val) => {
                          if (val) {
                            field.onChange(val);
                          } else {
                            form.resetField("endTime");
                          }
                        }}
                        quickOptions={dateQuickOptions}
                        selected={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              defaultValue={[]}
              name="tags"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <SimpleTagPicker
                      disabled={form.getValues("category") === undefined}
                      forCategory={form.watch("category")}
                      onNewTagsSelected={(tags) => {
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="justify-between p-0">
              {props.onClose && (
                <Button
                  onClick={props.onClose}
                  type="button"
                  variant="secondary"
                >
                  Close
                </Button>
              )}
              <div className="grow"></div>
              <div className="flex items-center gap-2">
                <Button loading={createSession.isPending} type="submit">
                  Submit
                </Button>
                {props.onCreateAndClose && (
                  <Button
                    loading={createSession.isPending}
                    onClick={props.onCreateAndClose}
                    type="submit"
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
