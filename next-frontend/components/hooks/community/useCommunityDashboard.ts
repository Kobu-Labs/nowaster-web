import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCommunityDashboard = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.dashboard(communityId),
    enabled: !!communityId,
    staleTime: 60_000,
  });
};
