import * as CategoryApi from "@/api/categoryApi";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCategoryStats = () => {
  return useQuery({
    queryKey: [queryKeys.categories._def, "statistics"],
    queryFn: CategoryApi.getStatistics,
  });
};