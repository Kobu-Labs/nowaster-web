import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createToken, listTokens, revokeToken } from "@/api/tokenApi";
import { useToast } from "@/components/shadcn/use-toast";

export const useTokens = () => {
  return useQuery({
    queryKey: ["api-tokens"],
    queryFn: listTokens,
  });
};

export const useCreateToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast({ title: "Token created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create token", variant: "destructive" });
    },
  });
};

export const useRevokeToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: revokeToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast({ title: "Token revoked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to revoke token", variant: "destructive" });
    },
  });
};
