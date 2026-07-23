import { CommunityApi } from "@/api";
import type { CommunityRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateCommunity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["create"]) => {
      return await CommunityApi.create(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating community",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.mine._def,
      });

      toast({
        description: (
          <div className="flex items-center gap-2">
            Community
            <span className="font-semibold">{data.name}</span>
            created successfully
          </div>
        ),
      });
    },
  });

  return mutation;
};
