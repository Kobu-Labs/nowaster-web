import { CommunityApi } from "@/api";
import type { CommunityRequest, CommunityWithId } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useArchiveCommunity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["archive"]) => {
      return await CommunityApi.archive(data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.communities.mine.queryKey,
      });

      const previousCommunities = queryClient.getQueryData(
        queryKeys.communities.mine.queryKey,
      );

      queryClient.setQueryData(
        queryKeys.communities.mine.queryKey,
        (old: CommunityWithId[] | undefined) =>
          old?.filter((community) => community.id !== data.id),
      );

      return { previousCommunities };
    },
    onError: (error, _data, context) => {
      queryClient.setQueryData(
        queryKeys.communities.mine.queryKey,
        context?.previousCommunities,
      );
      toast({
        description: error.message,
        title: "Error archiving community",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.mine._def,
      });
    },
    onSuccess: () => {
      toast({
        description: "Community archived",
      });
    },
  });

  return mutation;
};
