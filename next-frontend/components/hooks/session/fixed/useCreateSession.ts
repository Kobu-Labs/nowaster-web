import { ScheduledSessionApi } from "@/api";
import { ScheduledSessionRequest } from "@/api/definitions";
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
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
