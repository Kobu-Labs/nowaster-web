import { ScheduledSessionApi } from "@/api";
import { ScheduledSession } from "@/validation/models";
import { useQuery } from "@tanstack/react-query";

export const useActiveSession = () : ScheduledSession[] => {
  const { data: result } = useQuery({
    queryKey: ["sessions", "active"],
    retry: false,
    queryFn: async () => {
      const data = await ScheduledSessionApi.getActiveSessions();
      return data.isOk ? data.value : [];
    },
  });

  return result || [];
};
