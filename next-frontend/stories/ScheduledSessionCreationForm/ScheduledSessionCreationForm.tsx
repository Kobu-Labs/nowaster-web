import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { ArrowBigRight } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createScheduledSchema } from "@/validation/requests/scheduledSession"
import { CategoryPicker } from "../CategoryPicker/CategoryPicker"
import { ScheduledSessionApi } from "@/api"
import { DateTimePicker } from "../DateTimePicker/DateTimePicker"
import { useForm } from "react-hook-form"
import { TagPicker } from "../TagPicker/TagPicker"
import { Card, CardContent } from "@/components/ui/card"


export function ScheduledSessionCreationForm() {
  const form = useForm<z.infer<typeof createScheduledSchema>>({
    resolver: zodResolver(createScheduledSchema),
  })

  async function onSubmit(values: z.infer<typeof createScheduledSchema>) {
    const result = await ScheduledSessionApi.create(values)
  }

  return (
    <Card className="inline-flex">
      <CardContent className="mt-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem >
                  <FormLabel className="block">Category</FormLabel>
                  <FormControl>
                    <CategoryPicker categories={["one", "two", "three"]} onCategorySelected={(category) => {
                      if (category === null) {
                        form.resetField("category")
                      } else {
                        field.onChange(category)
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
                          form.resetField("startTime")
                        } else {
                          field.onChange(date)
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
                          form.resetField("endTime")
                        } else {
                          field.onChange(date)
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
              name="tags"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block">Tags</FormLabel>
                  <FormControl>
                    <TagPicker
                      tags={["one", "two", "three"]}
                      onTagSelected={(tags) => {
                        field.onChange(tags)
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
