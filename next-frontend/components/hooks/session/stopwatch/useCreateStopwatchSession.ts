import { StopwatchApi } from "@/api";
import type {
  ScheduledSessionWithId,
  StopwatchSessionRequest,
  StopwatchSessionWithId,
} from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateStopwatchSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: StopwatchSessionRequest["create"]) => {
      return await StopwatchApi.create(data);
    },
    onError: (error, _data, context) => {
      queryClient.setQueryData(
        queryKeys.sessions.active.queryKey,
        context?.previousSessions,
      );
      toast({
        description: error.message,
        title: "Error creating session",
        variant: "destructive",
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.active.queryKey,
      });
      const previousSessions = queryClient.getQueryData(
        queryKeys.sessions.active.queryKey,
      );

      queryClient.setQueryData(
        queryKeys.sessions.active.queryKey,
        (
          old:
            | (ScheduledSessionWithId | StopwatchSessionWithId)[]
            | undefined,
        ) => {
          const optimisticSession: StopwatchSessionWithId = {
            category: null,
            description: null,
            id: "optimistic",
            projectId: data.projectId ?? null,
            session_type: "stopwatch",
            startTime: data.startTime,
            tags: [],
            taskId: data.taskId ?? null,
          };
          return [...(old ?? []), optimisticSession];
        },
      );

      return { previousSessions };
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active._def,
      });
    },
    onSuccess: () => {
      toast({
        description: "Session created successfully!",
        variant: "default",
      });
    },
  });

  return mutation;
};
