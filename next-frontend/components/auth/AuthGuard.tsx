import { useAuth } from "@/components/hooks/useAuth";
import { clearAuthCookies, getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshTokens } from "@/api/baseApi";

export function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { setTokens, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      return;
    }

    if (getCurrentUser()) {
      refreshTokens()
        .then(setTokens)
        .catch(() => {
          clearAuthCookies();
          router.push("/sign-in");
        });
    } else {
      router.push("/");
    }
  }, [user, router, setTokens]);

  if (!user) {
    return null;
  }

  return children;
}
