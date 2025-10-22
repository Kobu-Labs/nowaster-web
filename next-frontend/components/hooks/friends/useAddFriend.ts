import { FriendRequestApi } from "@/api";
import { useToast } from "@/components/shadcn/use-toast";
import { emptyStringToUndefined } from "@/lib/utils";
import type { AddFriendFormValues } from "@/validation/add-friend";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddFriend = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: AddFriendFormValues) => {
      return await FriendRequestApi.create({
        introduction_message: emptyStringToUndefined(data.introductionMessage, {
          trim: true,
        }),
        recipient_name: data.username,
      });
    },

    onError: (error) => {
      toast({
        description: error.message,
        title: "Error",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends", "requests"],
      });
      toast({
        description: "Your friend request has been sent successfully.",
        title: "Friend request sent",
        variant: "default",
      });
    },
  });

  return mutation;
};
