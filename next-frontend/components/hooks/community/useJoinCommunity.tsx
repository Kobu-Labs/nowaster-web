import type { CommunityMember, CommunityRequest, CommunityWithId } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { useAuth } from "@/components/hooks/useAuth";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useJoinCommunity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["join"]) => {
      return await CommunityApi.join(data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.communities.mine.queryKey,
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.communities.members(data.communityId).queryKey,
      });

      const previousMembers = queryClient.getQueryData(
        queryKeys.communities.members(data.communityId).queryKey,
      );
      const previousCommunities = queryClient.getQueryData(
        queryKeys.communities.mine.queryKey,
      );

      if (user) {
        const optimisticMember: CommunityMember = {
          id: "optimistic",
          joined_at: new Date(),
          role: "member",
          user: {
            avatar_url: null,
            id: user.id,
            username: user.username,
          },
        };

        queryClient.setQueryData(
          queryKeys.communities.members(data.communityId).queryKey,
          (old: CommunityMember[] | undefined) => [
            ...(old ?? []),
            optimisticMember,
          ],
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- eslint's type program resolves this differently from tsc; the cast is load-bearing for `tsc --noEmit`
      const cachedCommunity = queryClient.getQueryData(
        queryKeys.communities.byId(data.communityId).queryKey,
      ) as CommunityWithId | undefined;

      if (cachedCommunity) {
        queryClient.setQueryData(
          queryKeys.communities.mine.queryKey,
          (old: CommunityWithId[] | undefined) => {
            if (old?.some((community) => community.id === cachedCommunity.id)) {
              return old;
            }
            return [...(old ?? []), cachedCommunity];
          },
        );
      }

      return { previousCommunities, previousMembers };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(
        queryKeys.communities.members(data.communityId).queryKey,
        context?.previousMembers,
      );
      queryClient.setQueryData(
        queryKeys.communities.mine.queryKey,
        context?.previousCommunities,
      );
      toast({
        description: error.message,
        title: "Couldn't join community",
        variant: "destructive",
      });
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.mine._def,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.members(variables.communityId).queryKey,
      });
    },
    onSuccess: () => {
      toast({
        description: "Welcome to the community!",
      });
    },
  });

  return mutation;
};
