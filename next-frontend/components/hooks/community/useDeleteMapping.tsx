import type { CategoryMapping, CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteMapping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["deleteMapping"]) => {
      return await CommunityApi.deleteMapping(data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.communities.myMappings(data.communityId).queryKey,
      });

      const previousMappings = queryClient.getQueryData(
        queryKeys.communities.myMappings(data.communityId).queryKey,
      );

      queryClient.setQueryData(
        queryKeys.communities.myMappings(data.communityId).queryKey,
        (old: CategoryMapping[] | undefined) =>
          old?.filter((mapping) => mapping.id !== data.id),
      );

      return { previousMappings };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(
        queryKeys.communities.myMappings(data.communityId).queryKey,
        context?.previousMappings,
      );
      toast({
        description: error.message,
        title: "Couldn't remove mapping",
        variant: "destructive",
      });
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.myMappings(variables.communityId).queryKey,
      });
    },
  });

  return mutation;
};
