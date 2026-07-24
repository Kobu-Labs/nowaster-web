import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSendDirectInvite = (communityId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteeUsername: string) =>
      await CommunityApi.createDirectInvite({
        communityId,
        inviteeUsername,
      } satisfies CommunityRequest["createDirectInvite"]),
    onError: (error) => {
      toast({
        description: error.message,
        title: "Couldn't send invite",
        variant: "destructive",
      });
    },
    onSuccess: async (invite) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.invites(communityId).queryKey,
      });
      toast({
        description: `Invite sent to ${invite.invited_user?.username ?? "the user"}.`,
        title: "Invite sent",
      });
    },
  });
};
