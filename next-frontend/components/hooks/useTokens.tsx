import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createToken, listTokens, revokeToken } from "@/api/tokenApi";
import { useToast } from "@/components/shadcn/use-toast";

export const useTokens = () => {
  return useQuery({
    queryFn: listTokens,
    queryKey: ["api-tokens"],
  });
};

export const useCreateToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createToken,
    onError: () => {
      toast({ title: "Failed to create token", variant: "destructive" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast({ title: "Token created successfully" });
    },
  });
};

export const useRevokeToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: revokeToken,
    onError: () => {
      toast({ title: "Failed to revoke token", variant: "destructive" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast({ title: "Token revoked successfully" });
    },
  });
};
