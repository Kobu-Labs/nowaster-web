import { AvatarApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAvatarEnable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AvatarApi.enable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatar._def });
    },
  });
};
