import { useToast } from "@/components/shadcn/use-toast";
import { useMutation } from "@tanstack/react-query";
import { startImpersonation, stopImpersonation } from "@/api/impersonationApi";
import { useState, useEffect } from "react";

export const useImpersonation = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationToken, setImpersonationToken] = useState<string | null>(
    null,
  );
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("impersonation_token");
    if (token) {
      setIsImpersonating(true);
      setImpersonationToken(token);
    }
  }, []);

  const startMutation = useMutation({
    mutationFn: startImpersonation,
    onSuccess: (data) => {
      localStorage.setItem("impersonation_token", data.impersonationToken);
      setImpersonationToken(data.impersonationToken);
      setIsImpersonating(true);
      toast({ title: "Impersonation started" });
      window.location.href = "/home";
    },
    onError: (e) => {
            console.error(e)
      toast({ title: "Failed to start impersonation", variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => {
      if (!impersonationToken) throw new Error("No impersonation token");
      return stopImpersonation(impersonationToken);
    },
    onSuccess: () => {
      localStorage.removeItem("impersonation_token");
      setImpersonationToken(null);
      setIsImpersonating(false);
      toast({ title: "Impersonation stopped" });
      window.location.href = "/home";
    },
    onError: () => {
      toast({ title: "Failed to stop impersonation", variant: "destructive" });
    },
  });

  return {
    isImpersonating,
    startImpersonation: startMutation.mutate,
    stopImpersonation: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};
