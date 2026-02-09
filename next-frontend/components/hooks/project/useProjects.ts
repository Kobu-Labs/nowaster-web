import { ProjectsApi } from "@/api";
import type { ProjectRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useProjects = (params?: ProjectRequest["readMany"]) => {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await ProjectsApi.getProjects(params),
    queryKey: [...queryKeys.projects.all.queryKey, params],
    staleTime: Infinity,
  });
};
