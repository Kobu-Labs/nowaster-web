"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendRequestApi } from "@/api";
import { cn, emptyStringToUndefined } from "@/lib/utils";
import { useToast } from "@/components/shadcn/use-toast";

export const AddFriend = () => {
  const [username, setUsername] = useState("");
  const [introductionMessage, setIntroductionMessage] = useState<
    string | undefined
  >(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error("Username is required");
      }
      const data = await FriendRequestApi.create({
        recipient_name: username,
        introduction_message: emptyStringToUndefined(introductionMessage, {
          trim: true,
        }),
      });

      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends", "requests"],
      });
      setUsername("");
      setIntroductionMessage(undefined);
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={cn(
              "h-9",
              sendRequest.isError &&
                "border-destructive focus-visible:ring-destructive",
              sendRequest.isSuccess &&
                "border-green-300 focus-visible:ring-gray-300",
            )}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Add a message (optional)"
            value={introductionMessage}
            onChange={(e) => setIntroductionMessage(e.target.value)}
            className={cn(
              "h-9",
              sendRequest.isError &&
                "border-destructive focus-visible:ring-destructive",
              sendRequest.isSuccess &&
                "border-green-300 focus-visible:ring-gray-300",
            )}
          />
        </div>
        <Button
          size="sm"
          className="h-9"
          onClick={() => sendRequest.mutate()}
          loading={sendRequest.isPending}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Friend
        </Button>
      </div>
    </div>
  );
};
