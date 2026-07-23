import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useMyMappings = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.myMappings(communityId),
    enabled: !!communityId,
  });
};
