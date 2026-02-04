import { useAuth } from "@/components/hooks/useAuth";

export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.role === "admin";
};
