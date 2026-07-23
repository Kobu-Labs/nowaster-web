import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCommunityById = (id: string) => {
  return useQuery({ ...queryKeys.communities.byId(id), enabled: !!id });
};
