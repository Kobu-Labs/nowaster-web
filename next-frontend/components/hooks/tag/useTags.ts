import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useTags = () => {
  return useQuery({
    ...queryKeys.tags.all,
    staleTime: Infinity,
  });
};
