import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  return useQuery({
    ...queryKeys.categories.all,
    staleTime: Infinity,
  });
};
