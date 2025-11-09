import { ProjectsApi } from "@/api";
import type { ProjectRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateProject = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: ProjectRequest["update"]) => {
      return await ProjectsApi.updateProject(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error updating project",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });

      toast({
        description: (
          <div className="flex items-center gap-2">
            Project
            <span className="font-semibold">{data.name}</span>
            updated successfully
          </div>
        ),
      });
    },
  });

  return mutation;
};
