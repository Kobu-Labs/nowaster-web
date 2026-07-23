import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useTrackedCategories = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.trackedCategories(communityId),
    enabled: !!communityId,
  });
};
