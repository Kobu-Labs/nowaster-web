import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCommunityInvites = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.invites(communityId),
    enabled: !!communityId,
  });
};
