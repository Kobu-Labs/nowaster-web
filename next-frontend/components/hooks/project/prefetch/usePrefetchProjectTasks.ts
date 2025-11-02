import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

export const usePrefetchProjectTasks = (projectId: string) => {
  const queryClient = useQueryClient();

  return queryClient.prefetchQuery({
    ...queryKeys.tasks.byProject(projectId),
    staleTime: 20_000,
  });
};
