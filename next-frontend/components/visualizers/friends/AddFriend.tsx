"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddFriendFormValues, addFriendSchema } from "@/validation/add-friend";
import { useAddFriend } from "@/components/hooks/friends/useAddFriend";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/shadcn/form";

export const AddFriend = () => {
  const form = useForm<AddFriendFormValues>({
    resolver: zodResolver(addFriendSchema),
  });

  const sendRequest = useAddFriend();

  const onSubmit = async (data: AddFriendFormValues) => {
    await sendRequest.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col sm:flex-row gap-2 w-full my-2"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter username"
                  className={cn(
                    "h-9",
                    sendRequest.isError &&
                      "border-destructive focus-visible:ring-destructive",
                    sendRequest.isSuccess &&
                      "border-green-300 focus-visible:ring-gray-300",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="introductionMessage"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  {...field}
                  placeholder="Add a message (optional)"
                  className={cn(
                    "h-9",
                    sendRequest.isError &&
                      "border-destructive focus-visible:ring-destructive",
                    sendRequest.isSuccess &&
                      "border-green-300 focus-visible:ring-gray-300",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="h-9"
          loading={sendRequest.isPending}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Friend
        </Button>
      </form>
    </Form>
  );
};
