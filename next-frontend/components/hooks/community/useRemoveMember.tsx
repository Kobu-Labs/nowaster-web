import type { CommunityMembersPage } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRemoveMember = (communityId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = queryKeys.communities.members(communityId).queryKey;

  return useMutation({
    mutationFn: async (userId: string) =>
      await CommunityApi.removeMember({ communityId, userId }),
    onMutate: async (userId) => {
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
            members: page.members.filter((member) => member.user.id !== userId),
            total: page.members.some((member) => member.user.id === userId)
              ? page.total - 1
              : page.total,
          })),
        };
      });

      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't remove member",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
