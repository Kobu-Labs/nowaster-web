import { ScheduledSessionApi, StopwatchApi } from "@/api";
import {
  ScheduledSessionSchema,
  StopwatchSessionWithId,
} from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useFinishStopwatchSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (session: StopwatchSessionWithId) => {
      const parsed = await ScheduledSessionSchema.safeParseAsync({
        ...session,
        tags: session.tags ?? [],
        session_type: "fixed",
        endTime: new Date(),
      });

      if (!parsed.success) {
        console.error(parsed.error);
        throw new Error("Fill out start time and category!");
      }
      const scheduled = await ScheduledSessionApi.create(parsed.data);

      if (scheduled.isErr) {
        throw new Error(scheduled.error.message);
      }
      await StopwatchApi.remove({ id: session.id });
      return scheduled.value;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
      });
      toast({
        description: `Session finished successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error finishing session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return mutation;
};
