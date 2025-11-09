import { ProjectsApi } from "@/api";
import type { ProjectRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateProject = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: ProjectRequest["create"]) => {
      return await ProjectsApi.createProject(data);
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating project",
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
            created successfully
          </div>
        ),
      });
    },
  });

  return mutation;
};
