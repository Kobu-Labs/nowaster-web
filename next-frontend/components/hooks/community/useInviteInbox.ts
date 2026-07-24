import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useInviteInbox = () => {
  return useQuery({
    ...queryKeys.communities.inbox,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
};
