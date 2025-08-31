import { ScheduledSessionApi } from "@/api";
import type { ScheduledSessionRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateScheduledSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: ScheduledSessionRequest["create"]) => {
      return await ScheduledSessionApi.create(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating session",
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

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tags._def,
      });

      toast({
        description: `Session created successfully!`,
        variant: "default",
      });
    },
  });

  return mutation;
};
