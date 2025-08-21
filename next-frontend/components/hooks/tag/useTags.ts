import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTags = () => {
  return useQuery({
    ...queryKeys.tags.all,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
};
