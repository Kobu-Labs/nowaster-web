import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const prefetchProjectDetails = (projectId: string) => {
  return queryClient.prefetchQuery({
    ...queryKeys.projects.byId(projectId),
    staleTime: 20_000,
  });
};
