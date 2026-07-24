import type { CommunityInvite } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRespondToInvite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = queryKeys.communities.inbox.queryKey;

  return useMutation({
    mutationFn: async ({ inviteId, accept }: { accept: boolean; inviteId: string; }) =>
      await CommunityApi.respondToInvite({ inviteId, accept }),
    onMutate: async ({ inviteId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityInvite[]>(key);
      queryClient.setQueryData<CommunityInvite[]>(key, (old) =>
        old?.filter((invite) => invite.id !== inviteId));
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't respond to invite",
        variant: "destructive",
      });
    },
    onSuccess: async (invite, { accept }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.communities.mine._def });
      if (accept) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.communities.members(invite.community_id).queryKey,
        });
        toast({ description: "Welcome to the community!", title: "Invite accepted" });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
