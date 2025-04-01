import { ScheduledSessionApi, StopwatchApi } from "@/api";
import {
  ScheduledSessionRequest,
  StopwatchSessionRequest,
} from "@/api/definitions";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation } from "@tanstack/react-query";

export const useUpdateSession = (sessionType: "stopwatch" | "scheduled") => {
  if (sessionType === "stopwatch") {
    return useUpdateStopwatchSession();
  }
  if (sessionType === "scheduled") {
    return useUpdateScheduledSession();
  }
  throw new Error("Invalid session type");
};

const useUpdateStopwatchSession = () => {
  const { toast } = useToast();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: StopwatchSessionRequest["update"]) => {
      const result = await StopwatchApi.update(data);
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

const useUpdateScheduledSession = () => {
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
