import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useInvitePreview = (code: string) => {
  return useQuery({
    ...queryKeys.communities.invitePreview(code),
    enabled: !!code,
  });
};
