import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  return useQuery({
    ...queryKeys.categories.all,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
};
