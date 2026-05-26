import { AvatarApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSetPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (presetId: string) => AvatarApi.setPreset({ presetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatar.current.queryKey });
    },
  });
};
