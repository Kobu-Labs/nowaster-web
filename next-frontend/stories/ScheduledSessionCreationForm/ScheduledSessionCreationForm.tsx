import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { CategoryPicker } from "../CategoryPicker/CategoryPicker";
import { ScheduledSessionApi } from "@/api";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { useForm } from "react-hook-form";
import { TagPicker } from "../TagPicker/TagPicker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ApiResult = Awaited<ReturnType<typeof ScheduledSessionApi.create>>;

export const ScheduledSessionCreationForm = () => {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<CreateScheduledSessionRequest>({
    resolver: zodResolver(createScheduledSchema),
  });

  async function onSubmit(values: CreateScheduledSessionRequest) {
    const result = await ScheduledSessionApi.create(values);
    setResult(result);
  }

  return (
    <Card >
      {result && <CardHeader>
        {result.isOk
          ? <div className="text-[#adfa1d]">Session created succefully!</div>
          : <div className="text-[#7d1715]">Session failed to be created: {result.error.message}</div>}
      </CardHeader>}
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
                      if (category === null) {
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
                  <FormItem>
                    <FormLabel className="block">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker onDateSelected={(date) => {
                        if (date === null) {
                          form.resetField("startTime");
                        } else {
                          field.onChange(date);
                        }
                      }}></DateTimePicker>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
                      <DateTimePicker onDateSelected={(date) => {
                        if (date === null) {
                          form.resetField("endTime");
                        } else {
                          field.onChange(date);
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

            <Button type="submit" className={cn(result && result.isErr && "bg-[#7d1715]")}>Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
