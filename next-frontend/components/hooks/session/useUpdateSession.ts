import { ScheduledSessionApi, StopwatchApi } from "@/api";
import {
  ScheduledSessionRequest,
  StopwatchSessionRequest,
} from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateSession(
  sessionType: "stopwatch",
): ReturnType<typeof useUpdateStopwatchSession>;
export function useUpdateSession(
  sessionType: "scheduled",
): ReturnType<typeof useUpdateScheduledSession>;

export function useUpdateSession(sessionType: "stopwatch" | "scheduled") {
  const updateStopwatch = useUpdateStopwatchSession();
  const updateScheduled = useUpdateScheduledSession();

  if (sessionType === "stopwatch") {
    return updateStopwatch;
  }
  if (sessionType === "scheduled") {
    return updateScheduled;
  }

  throw new Error("Invalid session type");
}

const useUpdateStopwatchSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: StopwatchSessionRequest["update"]) => {
      const result = await StopwatchApi.update(data);
      if (result.isErr) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active._def,
      });
      toast({
        description: `Session updated successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return updateSessionMutation;
};

const useUpdateScheduledSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: ScheduledSessionRequest["update"]) => {
      const result = await ScheduledSessionApi.update(data);
      if (result.isErr) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
      });
      toast({
        description: `Session updated successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return updateSessionMutation;
};
