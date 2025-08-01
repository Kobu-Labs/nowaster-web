import { CategoryApi } from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) =>
      await CategoryApi.deleteCategory(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories._def });
    },
  });
};
