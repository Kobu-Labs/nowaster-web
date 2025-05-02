import { FriendRequestApi } from "@/api";
import { useToast } from "@/components/shadcn/use-toast";
import { emptyStringToUndefined } from "@/lib/utils";
import { AddFriendFormValues } from "@/validation/add-friend";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddFriend = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: AddFriendFormValues) => {
      return await FriendRequestApi.create({
        recipient_name: data.username,
        introduction_message: emptyStringToUndefined(data.introductionMessage, {
          trim: true,
        }),
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends", "requests"],
      });
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

  return mutation;
};
