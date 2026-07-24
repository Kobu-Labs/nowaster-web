import type { CommunityMembersPage, CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateMemberRole = (communityId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = queryKeys.communities.members(communityId).queryKey;

  return useMutation({
    mutationFn: async (params: Omit<CommunityRequest["updateMemberRole"], "communityId">) =>
      await CommunityApi.updateMemberRole({ communityId, ...params }),
    onMutate: async ({ userId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<CommunityMembersPage>>(key);

      queryClient.setQueryData<InfiniteData<CommunityMembersPage>>(key, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            members: page.members.map((member) =>
              member.user.id === userId ? { ...member, role: newRole } : member,
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't update role",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
