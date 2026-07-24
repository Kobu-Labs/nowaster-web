import { CommunityApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useJoinViaCode = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => await CommunityApi.joinViaCode({ code }),
    onError: (error) => {
      toast({
        description: error.message,
        title: "Couldn't join community",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.communities.mine._def });
      toast({ description: "Welcome to the community!" });
    },
  });
};
