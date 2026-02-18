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
  useState,
} from "react";

type AuthProviderProps = {
  initialUser?: null | User;
} & PropsWithChildren;

export const AuthProvider: FC<AuthProviderProps> = ({ children, initialUser = null }) => {
  const [user, setUser] = useState<null | User>(initialUser);
  const router = useRouter();

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
