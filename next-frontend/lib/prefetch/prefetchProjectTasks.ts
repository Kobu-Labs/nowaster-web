import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const prefetchProjectTasks = (projectId: string) => {
  return queryClient.prefetchQuery({
    ...queryKeys.projects.tasks(projectId),
    staleTime: 20_000,
  });
};
