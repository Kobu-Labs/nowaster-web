import { ScheduledSessionApi, StopwatchApi } from "@/api";
import type {
  StopwatchSessionWithId} from "@/api/definitions";
import {
  ScheduledSessionRequestSchema
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
        description: session.description,
        endTime: new Date(),
        startTime: session.startTime,
        tag_ids: session.tags?.map((tag) => tag.id) ?? [],
      });

      if (!parsed.success) {
        throw new Error("Fill out start time and category!");
      }

      await StopwatchApi.remove({ id: session.id });
      return await ScheduledSessionApi.create(parsed.data);
    },

    onError: (error) => {
      toast({
        description: error.message,
        title: "Error finishing session",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories._def,
      });
      toast({
        description: `Session finished successfully!`,
        variant: "default",
      });
    },
  });

  return mutation;
};
