import React, { FC } from "react"
import { ScheduledSessionApi } from "@/api"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ScheduledSessionRequest,
  ScheduledSessionRequestSchema,
} from "@kobu-labs/nowaster-js-typing"
import { useQueryClient } from "@tanstack/react-query"
import {
  addHours,
  addMinutes,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns"
import { ArrowBigRight } from "lucide-react"
import { useForm } from "react-hook-form"

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys"
import { Button } from "@/components/shadcn/button"
import { Card, CardContent } from "@/components/shadcn/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { useToast } from "@/components/shadcn/use-toast";
import { DateTimePicker, QuickOption } from "@/components/visualizers/DateTimePicker";
import { SessionCard } from "@/components/visualizers/categories/SessionCard";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";


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
]

export const ScheduledSessionCreationForm: FC = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<ScheduledSessionRequest["create"]>({
    resolver: zodResolver(ScheduledSessionRequestSchema.create),
  })

  async function onSubmit(values: ScheduledSessionRequest["create"]) {
    const result = await ScheduledSessionApi.create(values)
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions._def })
    toast(
      result.isErr
        ? {
            title: "Session creation failed",
            description: result.error.message,
            variant: "destructive",
          }
        : {
            className: "text-[#adfa1d]",
            title: "Session created successfully",
            description: (
              <SessionCard variant="borderless" session={result.value} />
            ),
            variant: "default",
          }
    )
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
                <FormItem>
                  <FormLabel className="block">Category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      onCategorySelected={(category) => {
                        if (category === undefined) {
                          form.resetField("category")
                        } else {
                          field.onChange({ name: category })
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
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Insert your description"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
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
                    <FormItem>
                      <FormLabel className="block">Start Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          quickOptions={creationFormQuickOptions}
                          selected={field.value || undefined}
                          onSelect={(val) => {
                            if (val) {
                              field.onChange(val)
                              if (!form.getValues("endTime")) {
                                form.setValue("endTime", val)
                              }
                            } else {
                              form.resetField("startTime")
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
                            field.onChange(val)
                          } else {
                            form.resetField("endTime")
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
                    <SimpleTagPicker
                      onSelectedTagsChanged={(tags) => {
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
  )
}
