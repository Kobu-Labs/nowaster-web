import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRegenerateInviteCode = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["regenerateInviteCode"]) => {
      return await CommunityApi.regenerateInviteCode(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Couldn't regenerate invite code",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.communities.inviteCode(variables.communityId).queryKey,
        data,
      );
      toast({
        description: "Invite code regenerated. The old code no longer works.",
      });
    },
  });

  return mutation;
};
