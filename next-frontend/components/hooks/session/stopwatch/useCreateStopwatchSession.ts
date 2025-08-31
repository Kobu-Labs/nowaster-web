import { StopwatchApi } from "@/api";
import type { StopwatchSessionRequest } from "@/api/definitions";
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
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating session",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active._def,
      });
      toast({
        description: `Session created successfully!`,
        variant: "default",
      });
    },
  });

  return mutation;
};
