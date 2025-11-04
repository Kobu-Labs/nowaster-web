import { queryClient } from "@/app/home/providers";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const prefetchProjectTasks = (projectId: string) => {
  return queryClient.prefetchQuery({
    ...queryKeys.tasks.byProject(projectId),
    staleTime: 20_000,
  });
};
