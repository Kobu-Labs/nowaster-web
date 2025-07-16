import { StopwatchApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteStopwatchSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      await StopwatchApi.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active._def,
      });
    },
  });
};
