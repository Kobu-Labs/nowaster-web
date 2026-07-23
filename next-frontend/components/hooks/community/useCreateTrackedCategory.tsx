import type { CommunityRequest } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateTrackedCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["createTrackedCategory"]) => {
      return await CommunityApi.createTrackedCategory(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating tracked category",
        variant: "destructive",
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.trackedCategories(variables.communityId)
          .queryKey,
      });
      toast({
        description: "Tracked category created",
      });
    },
  });

  return mutation;
};
