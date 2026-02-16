"use client";

import { AuthContext } from "@/components/hooks/useAuth";
import { env } from "@/env";
import { queryClient } from "@/lib/queryClient";
import {
  clearAuthCookies,
  getCurrentUser,
  setUserFromToken,
  type User,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<null | User>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoaded(true);
  }, []);

  const setTokens = useCallback((accessToken: string) => {
    queryClient.clear();
    setUserFromToken(accessToken);
    setUser(getCurrentUser());
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        credentials: "include",
        method: "POST",
      });
    } catch {
      // best-effort — proceed with client-side cleanup regardless
    }
    clearAuthCookies();
    queryClient.clear();
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: user !== null,
        setTokens,
        signOut,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
