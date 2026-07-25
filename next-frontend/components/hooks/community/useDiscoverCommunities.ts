import type { DiscoverySort } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type UseDiscoverCommunitiesParams = {
  category?: string;
  limit?: number;
  offset?: number;
  query?: string;
  sort?: DiscoverySort;
};

export const useDiscoverCommunities = (params: UseDiscoverCommunitiesParams) => {
  return useQuery({
    ...queryKeys.communities.discover(params),
    placeholderData: keepPreviousData,
  });
};
