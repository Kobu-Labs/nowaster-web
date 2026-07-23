import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteTrackedCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["deleteTrackedCategory"]) => {
      return await CommunityApi.deleteTrackedCategory(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Couldn't delete tracked category",
        variant: "destructive",
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.trackedCategories(variables.communityId)
          .queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.myMappings(variables.communityId).queryKey,
      });
      toast({
        description: "Tracked category deleted",
      });
    },
  });

  return mutation;
};
