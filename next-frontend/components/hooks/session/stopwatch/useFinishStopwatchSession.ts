import { ScheduledSessionApi, StopwatchApi } from "@/api";
import {
  ScheduledSessionRequestSchema,
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
      const parsed = await ScheduledSessionRequestSchema.create.safeParseAsync({
        category_id: session.category?.id,
        tag_ids: session.tags?.map((tag) => tag.id) ?? [],
        endTime: new Date(),
        startTime: session.startTime,
        description: session.description,
      });

      if (!parsed.success) {
        console.error(parsed.error);
        throw new Error("Fill out start time and category!");
      }

      await StopwatchApi.remove({ id: session.id });
      return await ScheduledSessionApi.create(parsed.data);
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
