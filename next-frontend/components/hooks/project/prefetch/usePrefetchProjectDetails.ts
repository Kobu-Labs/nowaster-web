import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

export const usePrefetchProjecetDetails = (projectId: string) => {
  const queryClient = useQueryClient();

  return queryClient.prefetchQuery({
    ...queryKeys.projects.byId(projectId),
    staleTime: 20_000,
  });
};
