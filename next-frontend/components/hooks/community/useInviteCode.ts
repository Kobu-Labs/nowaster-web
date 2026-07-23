import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useInviteCode = (communityId: string, enabled: boolean) => {
  return useQuery({
    ...queryKeys.communities.inviteCode(communityId),
    enabled: !!communityId && enabled,
  });
};
