import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useInfiniteQuery } from "@tanstack/react-query";

const MEMBERS_PAGE_SIZE = 50;

export const useCommunityMembers = (communityId: string) => {
  return useInfiniteQuery({
    enabled: !!communityId,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (sum, page) => sum + page.members.length,
        0,
      );
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number; }) =>
      await CommunityApi.listMembers({
        communityId,
        limit: MEMBERS_PAGE_SIZE,
        offset: pageParam,
      }),
    queryKey: queryKeys.communities.members(communityId).queryKey,
  });
};
