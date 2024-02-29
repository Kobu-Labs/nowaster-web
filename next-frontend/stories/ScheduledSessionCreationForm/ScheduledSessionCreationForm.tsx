import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { ArrowBigRight } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createScheduledSchema, CreateScheduledSessionRequest } from "@/validation/requests/scheduledSession";
import { CategoryPicker } from "@/stories/CategoryPicker/CategoryPicker";
import { ScheduledSessionApi } from "@/api";
import { useForm } from "react-hook-form";
import { TagPicker } from "@/stories/TagPicker/TagPicker";
import { Card, CardContent } from "@/components/ui/card";
import { FC } from "react";
import React from "react";
import { DateTimePicker, QuickOption } from "@/stories/DateTimePicker/DateTimePicker";
import { addHours, addMinutes, setMinutes, subHours, subMinutes } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { HistoryCard } from "@/stories/HistoryCard/HistoryCard";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";


const creationFormQuickOptions: QuickOption[] = [
  {
    label: "now",
    increment: () => new Date(),
  },
  {
    label: "clamp",
    increment: (date) => setMinutes(date, 0)
  },
  {
    label: "+ 15m",
    increment: (date) => addMinutes(date, 15)
  },
  {
    label: "- 15m",
    increment: (date) => subMinutes(date, 15)
  },
  {
    label: "+ 1h",
    increment: (date) => addHours(date, 1)
  },
  {
    label: "- 1h",
    increment: (date) => subHours(date, 1)
  },
];


export const ScheduledSessionCreationForm: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateScheduledSessionRequest>({
    resolver: zodResolver(createScheduledSchema),
  });

  async function onSubmit(values: CreateScheduledSessionRequest) {
    const result = await ScheduledSessionApi.create(values);
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions._def });
    toast(result.isErr ?
      {
        title: "Session creation failed",
        description: result.error.message,
        variant: "destructive",
      }
      :
      {
        className: "text-[#adfa1d]",
        title: "Session created successfully",
        description: (
          <HistoryCard variant="borderless" session={result.value} />
        ),
        variant: "default",
      });
  }

  return (
    <Card >
      <CardContent className="mt-3 ">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem >
                  <FormLabel className="block">Category</FormLabel>
                  <FormControl>
                    <CategoryPicker onCategorySelected={(category) => {
                      if (category === undefined) {
                        form.resetField("category");
                      } else {
                        field.onChange(category);
                      }
                    }} />
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
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Insert your description" value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center">
              <FormField
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <FormItem >
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
                  </div>
                )}
              />

              <ArrowBigRight className="m-10" />

              <FormField
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
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
                <FormItem>
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <TagPicker
                      onTagSelected={(tags) => {
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
