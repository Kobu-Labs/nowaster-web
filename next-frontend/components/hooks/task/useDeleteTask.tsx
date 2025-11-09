import { TasksApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; }) =>
      await TasksApi.deleteTask(params),
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error deleting task",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks._def });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });

      toast({
        description: "Task deleted successfully",
      });
    },
  });
};
