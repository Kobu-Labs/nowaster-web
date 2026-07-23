import type { CommunityMember, CommunityRequest, CommunityWithId } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { useAuth } from "@/components/hooks/useAuth";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLeaveCommunity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["leave"]) => {
      return await CommunityApi.leave(data);
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

      queryClient.setQueryData(
        queryKeys.communities.members(data.communityId).queryKey,
        (old: CommunityMember[] | undefined) =>
          old?.filter((member) => member.user.id !== user?.id),
      );

      queryClient.setQueryData(
        queryKeys.communities.mine.queryKey,
        (old: CommunityWithId[] | undefined) =>
          old?.filter((community) => community.id !== data.communityId),
      );

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
        title: "Couldn't leave community",
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
        description: "You've left the community",
      });
    },
  });

  return mutation;
};
