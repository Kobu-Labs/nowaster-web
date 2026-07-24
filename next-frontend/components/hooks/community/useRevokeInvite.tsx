import type { CommunityInvite } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRevokeInvite = (communityId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = queryKeys.communities.invites(communityId).queryKey;

  return useMutation({
    mutationFn: async (inviteId: string) =>
      await CommunityApi.revokeInvite({ communityId, inviteId }),
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityInvite[]>(key);
      queryClient.setQueryData<CommunityInvite[]>(key, (old) =>
        old?.map((invite) =>
          invite.id === inviteId ? { ...invite, status: "revoked" as const } : invite));
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't revoke invite",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
