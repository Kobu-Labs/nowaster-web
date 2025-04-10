import {
  ScheduledSessionRequest,
  ScheduledSessionRequestSchema,
} from "@/api/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addHours,
  addMinutes,
  differenceInMinutes,
  isBefore,
  isEqual,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns";
import { ArrowBigRight } from "lucide-react";
import { FC } from "react";
import { useForm } from "react-hook-form";

import { useCreateScheduledSession } from "@/components/hooks/session/fixed/useCreateSession";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  DateTimePicker,
  QuickOption,
} from "@/components/visualizers/DateTimePicker";
import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";
import { formatTime } from "@/lib/utils";
import { SessionPrecursor } from "@/validation/session/creation";

const creationFormQuickOptions: QuickOption[] = [
  {
    label: "now",
    increment: () => new Date(),
  },
  {
    label: "clamp",
    increment: (date) => setMinutes(date, 0),
  },
  {
    label: "+ 15m",
    increment: (date) => addMinutes(date, 15),
  },
  {
    label: "- 15m",
    increment: (date) => subMinutes(date, 15),
  },
  {
    label: "+ 1h",
    increment: (date) => addHours(date, 1),
  },
  {
    label: "- 1h",
    increment: (date) => subHours(date, 1),
  },
];

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
  onSave?: () => void;
};

export const ScheduledSessionCreationForm: FC<
  ScheduledSessionCreationFormProps
> = (props) => {
  const form = useForm<ScheduledSessionRequest["create"]>({
    resolver: zodResolver(ScheduledSessionRequestSchema.create),
    defaultValues: props.precursor,
  });

  const createSession = useCreateScheduledSession();

  async function onSubmit(values: ScheduledSessionRequest["create"]) {
    if (
      isBefore(values.endTime, values.startTime) ||
      isEqual(values.endTime, values.startTime)
    ) {
      form.setError("endTime", {
        message: "End time must be after start time",
      });
      return;
    }

    await createSession.mutateAsync(values, {
      onSuccess: () => {
        if (props.onSave) {
          props.onSave();
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
                    <SingleCategoryPicker
                      onSelectedCategoriesChanged={(category) => {
                        if (category === undefined) {
                          form.resetField("category");
                        } else {
                          field.onChange(category);
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
                        quickOptions={creationFormQuickOptions}
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
                        quickOptions={creationFormQuickOptions}
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

            <Button type="submit" loading={createSession.isPending}>
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
