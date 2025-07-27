import * as TagApi from "@/api/tagApi";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useTagStats = () => {
  return useQuery({
    queryKey: [queryKeys.tags._def, "statistics"],
    queryFn: TagApi.getStatistics,
  });
};