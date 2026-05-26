import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCategoryHints = (categoryId: string) => {
  return useQuery(queryKeys.avatar.categoryHints(categoryId));
};
