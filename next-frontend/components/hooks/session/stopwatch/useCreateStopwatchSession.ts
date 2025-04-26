import { StopwatchApi } from "@/api";
import { StopwatchSessionRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateStopwatchSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: StopwatchSessionRequest["create"]) => {
      const result = await StopwatchApi.create(data);
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
        description: `Session created successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return mutation;
};
