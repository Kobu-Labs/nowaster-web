import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  startImpersonation,
  stopImpersonation,
  getUserById,
} from "@/api/impersonationApi";
import { useState, useEffect } from "react";

type ImpersonationState = {
  userId: string;
  token: string;
};

export const useImpersonation = () => {
  const [impersonationState, setImpersonationToken] =
    useState<ImpersonationState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("impersonation_token");
    const userId = localStorage.getItem("impersonation_target_user_id");
    if (token && userId) {
      setImpersonationToken({
        token: token,
        userId: userId,
      });
    }
  }, []);

  const { data: targetUser } = useQuery({
    queryKey: ["impersonation", "targetUser", impersonationState?.userId],
    queryFn: () => getUserById(impersonationState?.userId!),
    enabled: !!impersonationState?.userId,
    staleTime: Infinity,
  });

  const startMutation = useMutation({
    mutationFn: startImpersonation,
    onSuccess: (data) => {
      localStorage.setItem("impersonation_token", data.impersonationToken);
      localStorage.setItem("impersonation_target_user_id", data.targetUserId);

      setImpersonationToken({
        token: data.impersonationToken,
        userId: data.targetUserId,
      });

      toast({ title: "Impersonation started" });

      window.location.href = "/home";
    },
    onError: (e) => {
      console.error(e);
      toast({ title: "Failed to start impersonation", variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => {
      if (!impersonationState) throw new Error("No impersonation token");
      return stopImpersonation(impersonationState.token);
    },
    onSuccess: () => {
      localStorage.removeItem("impersonation_token");
      localStorage.removeItem("impersonation_target_user_id");
      setImpersonationToken(null);
      toast({ title: "Impersonation stopped" });
      window.location.href = "/home";
    },
    onError: () => {
      toast({ title: "Failed to stop impersonation", variant: "destructive" });
    },
  });

  return {
    targetUser,
    startImpersonation: startMutation.mutate,
    stopImpersonation: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};
