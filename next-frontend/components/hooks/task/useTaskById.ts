import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useTaskById = (id: string) => {
  return useQuery({
    ...queryKeys.tasks.byId(id),
  });
};
