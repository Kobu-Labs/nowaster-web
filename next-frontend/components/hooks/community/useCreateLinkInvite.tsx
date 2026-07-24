import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateLinkInvite = (communityId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: Omit<CommunityRequest["createLinkInvite"], "communityId">,
    ) => await CommunityApi.createLinkInvite({ communityId, ...params }),
    onError: (error) => {
      toast({
        description: error.message,
        title: "Couldn't create invite link",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.invites(communityId).queryKey,
      });
      toast({ description: "Invite link created" });
    },
  });
};
