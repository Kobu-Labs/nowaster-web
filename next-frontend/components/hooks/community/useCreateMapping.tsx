import type { CategoryMapping, CategoryWithId, CommunityRequest, TrackedCategory } from "@/api/definitions";
import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateMapping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CommunityRequest["createMapping"]) => {
      return await CommunityApi.createMapping(data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.communities.myMappings(data.communityId).queryKey,
      });

      const previousMappings = queryClient.getQueryData(
        queryKeys.communities.myMappings(data.communityId).queryKey,
      );

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- eslint's type program resolves this differently from tsc; the cast is load-bearing for `tsc --noEmit`
      const trackedCategories = queryClient.getQueryData(
        queryKeys.communities.trackedCategories(data.communityId).queryKey,
      ) as TrackedCategory[] | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- see above
      const personalCategories = queryClient.getQueryData(
        queryKeys.categories.all.queryKey,
      ) as CategoryWithId[] | undefined;

      const trackedCategory = trackedCategories?.find(
        (category) => category.id === data.trackedCategoryId,
      );
      const personalCategory = personalCategories?.find(
        (category) => category.id === data.personalCategoryId,
      );

      if (trackedCategory && personalCategory) {
        const optimisticMapping: CategoryMapping = {
          created_at: new Date(),
          id: "optimistic",
          personal_category: personalCategory,
          tracked_category: trackedCategory,
        };

        queryClient.setQueryData(
          queryKeys.communities.myMappings(data.communityId).queryKey,
          (old: CategoryMapping[] | undefined) => [
            ...(old ?? []),
            optimisticMapping,
          ],
        );
      }

      return { previousMappings };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(
        queryKeys.communities.myMappings(data.communityId).queryKey,
        context?.previousMappings,
      );
      toast({
        description: error.message,
        title: "Couldn't map category",
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
