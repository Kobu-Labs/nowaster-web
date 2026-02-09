import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTasksWithSessionCountByProject = (projectId: null | string) => {
  return useQuery({
    ...queryKeys.projects.tasks(projectId ?? ""),
    enabled: projectId !== null,
    placeholderData: keepPreviousData,
  });
};
