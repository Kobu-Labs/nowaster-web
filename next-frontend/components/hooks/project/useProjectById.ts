import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useProjectById = (id: string) => {
  return useQuery({
    ...queryKeys.projects.byId(id),
  });
};
