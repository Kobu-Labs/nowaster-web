import { TasksApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

export const useDeleteTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks._def });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });

      // Check if we're currently on the deleted task's page
      if (pathname.includes(`/tasks/${variables.id}`)) {
        // Navigate to the parent project page
        const projectMatch = /\/projects\/([^/]+)/.exec(pathname);
        if (projectMatch) {
          router.push(`/home/projects/${projectMatch[1]}`);
        }
      }

      toast({
        description: "Task deleted successfully",
      });
    },
  });
};
