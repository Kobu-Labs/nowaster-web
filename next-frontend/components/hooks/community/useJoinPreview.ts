import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useJoinPreview = (code: string) => {
  return useQuery({
    ...queryKeys.communities.joinPreview(code),
    enabled: !!code,
  });
};
