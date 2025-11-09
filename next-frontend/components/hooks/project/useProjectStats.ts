import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useProjectStats = () => {
  return useQuery({
    ...queryKeys.projects.stats,
  });
};
