import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCommunityCapabilities = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.capabilities(communityId),
    enabled: !!communityId,
  });
};
