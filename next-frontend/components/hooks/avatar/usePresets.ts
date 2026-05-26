import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const usePresets = () => {
  return useQuery(queryKeys.avatar.presets);
};
