import { queryClient } from "@/app/home/providers";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const prefetchTask = (taskId: string) => {
  return queryClient.prefetchQuery({
    ...queryKeys.tasks.byId(taskId),
    staleTime: 20_000,
  });
};
