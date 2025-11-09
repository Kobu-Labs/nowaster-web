import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useProjectsWithTaskCount = () => {
  return useQuery({
    ...queryKeys.projects.details,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
};
