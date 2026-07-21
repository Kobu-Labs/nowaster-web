import { AvatarApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useTriggerGeneration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AvatarApi.triggerGeneration(),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.avatar.latestRun);
      queryClient.invalidateQueries(queryKeys.avatar.current);
    },
  });
};
