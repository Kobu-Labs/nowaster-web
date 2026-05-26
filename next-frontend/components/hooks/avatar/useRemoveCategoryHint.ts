import { AvatarApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRemoveCategoryHint = (categoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hintId: string) =>
      AvatarApi.removeCategoryHint({ categoryId, hintId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.categoryHints(categoryId).queryKey,
      });
    },
  });
};
