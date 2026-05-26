import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useSearchHints = (q: string) => {
  return useQuery({
    ...queryKeys.avatar.hints(q),
    staleTime: 30_000,
  });
};
