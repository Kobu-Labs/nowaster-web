import { ProjectsApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteProject = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; }) =>
      await ProjectsApi.deleteProject(params),
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error deleting project",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks._def });

      toast({
        description: "Project deleted successfully",
      });
    },
  });
};
