import * as TagApi from "@/api/tagApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) =>
      await TagApi.deleteTag(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
    },
  });
};
