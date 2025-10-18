import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getUserById,
  startImpersonation,
  stopImpersonation,
} from "@/api/impersonationApi";
import { useEffect, useState } from "react";

type ImpersonationState = {
  token: string;
  userId: string;
};

export const useImpersonation = () => {
  const [impersonationState, setImpersonationToken]
    = useState<ImpersonationState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("impersonation_token");
    const userId = localStorage.getItem("impersonation_target_user_id");
    if (token && userId) {
      setImpersonationToken({
        token,
        userId,
      });
    }
  }, []);

  const { data: targetUser } = useQuery({
    enabled: !!impersonationState?.userId,
    queryFn: () => {
      if (!impersonationState?.userId) {
        throw new Error("No user ID");
      }
      return getUserById(impersonationState.userId);
    },
    queryKey: ["impersonation", "targetUser", impersonationState?.userId],
    staleTime: Infinity,
  });

  const startMutation = useMutation({
    mutationFn: startImpersonation,
    onError: () => {
      toast({ title: "Failed to start impersonation", variant: "destructive" });
    },
    onSuccess: (data) => {
      localStorage.setItem("impersonation_token", data.impersonationToken);
      localStorage.setItem("impersonation_target_user_id", data.targetUserId);

      setImpersonationToken({
        token: data.impersonationToken,
        userId: data.targetUserId,
      });

      toast({ title: "Impersonation started" });

      globalThis.location.href = "/home";
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => {
      if (!impersonationState) {
        throw new Error("No impersonation token");
      }
      return stopImpersonation(impersonationState.token);
    },
    onError: () => {
      toast({ title: "Failed to stop impersonation", variant: "destructive" });
    },
    onSuccess: () => {
      localStorage.removeItem("impersonation_token");
      localStorage.removeItem("impersonation_target_user_id");
      setImpersonationToken(null);
      toast({ title: "Impersonation stopped" });
      globalThis.location.href = "/home";
    },
  });

  return {
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    startImpersonation: startMutation.mutate,
    stopImpersonation: stopMutation.mutate,
    targetUser,
  };
};
