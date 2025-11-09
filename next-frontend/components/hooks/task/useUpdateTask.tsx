import { TasksApi } from "@/api";
import type { TaskRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: TaskRequest["update"]) => {
      return await TasksApi.updateTask(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error updating task",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks._def });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });

      toast({
        description: (
          <div className="flex items-center gap-2">
            Task
            <span className="font-semibold">{data.name}</span>
            updated successfully
          </div>
        ),
      });
    },
  });

  return mutation;
};
