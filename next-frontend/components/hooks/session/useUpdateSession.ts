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
): ReturnType<typeof updateStopwatchSession>;
export function useUpdateSession(
  sessionType: "scheduled",
): ReturnType<typeof updateScheduledSession>;

export function useUpdateSession(sessionType: "stopwatch" | "scheduled") {
  const updateStopwatch = updateStopwatchSession();
  const updateScheduled = updateScheduledSession();

  if (sessionType === "stopwatch") {
    return updateStopwatch;
  }
  if (sessionType === "scheduled") {
    return updateScheduled;
  }

  throw new Error("Invalid session type");
}

const updateStopwatchSession = () => {
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

const updateScheduledSession = () => {
  const { toast } = useToast();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: ScheduledSessionRequest["update"]) => {
      const result = await ScheduledSessionApi.update(data);
      if (result.isErr) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
    onSuccess: async () => {
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
