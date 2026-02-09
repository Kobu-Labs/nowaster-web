import { ProjectsApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

export const useDeleteProject = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects._def });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks._def });

      // Check if we're currently on the deleted project's page
      if (pathname.includes(`/projects/${variables.id}`)) {
        // Navigate to the projects list page
        router.push("/home/projects");
      }

      toast({
        description: "Project deleted successfully",
      });
    },
  });
};
