import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateTrackedCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["updateTrackedCategory"]) => {
      return await CommunityApi.updateTrackedCategory(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error updating tracked category",
        variant: "destructive",
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.trackedCategories(variables.communityId)
          .queryKey,
      });
      toast({
        description: "Tracked category updated",
      });
    },
  });

  return mutation;
};
