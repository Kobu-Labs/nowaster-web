import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBlockRule,
  deleteBlockRule,
  listBlockRules,
} from "@/api/blockRuleApi";
import { useToast } from "@/components/shadcn/use-toast";

const BLOCK_RULES_KEY = ["block-rules"];

export const useBlockRules = () => {
  return useQuery({
    queryFn: listBlockRules,
    queryKey: BLOCK_RULES_KEY,
  });
};

export const useCreateBlockRule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createBlockRule,
    onError: (error: { response?: { status?: number; }; }) => {
      toast({
        title:
          error.response?.status === 409
            ? "Domain is already in your block list"
            : "Failed to add domain",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BLOCK_RULES_KEY });
    },
  });
};

export const useDeleteBlockRule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteBlockRule,
    onError: () => {
      toast({ title: "Failed to remove domain", variant: "destructive" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BLOCK_RULES_KEY });
    },
  });
};
