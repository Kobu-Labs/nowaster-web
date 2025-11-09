import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTasksByProject = (projectId: null | string) => {
  return useQuery({
    ...queryKeys.projects.tasks(projectId ?? ""),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
};
