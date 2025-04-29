import { ScheduledSessionApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteScheduledSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await ScheduledSessionApi.deleteSingle({ id: sessionId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
      });
      toast({
        title: "Session deleted succesfully",
        variant: "default",
      });
    },
  });
  return mutation;
};
