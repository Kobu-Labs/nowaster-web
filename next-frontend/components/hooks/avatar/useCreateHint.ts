import { AvatarApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateHint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => AvatarApi.createHint({ label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatar.hints._def });
    },
  });
};
