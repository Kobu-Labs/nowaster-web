import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useMyCommunities = () => {
  return useQuery(queryKeys.communities.mine);
};
