import { CommunityApi } from "@/api";
import type { CommunityRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateCommunity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["update"]) => {
      return await CommunityApi.update(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error updating community",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.byId(data.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.mine._def,
      });

      toast({
        description: "Community updated",
      });
    },
  });

  return mutation;
};
