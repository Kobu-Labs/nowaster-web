"use client";

import { AuthContext } from "@/components/hooks/useAuth";
import {
  clearAuthCookies,
  getAccessToken,
  getCurrentUser,
  setAuthTokens,
  type User,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  // Start with null to avoid hydration mismatch
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoaded(true);
  }, []);

  const getToken = useCallback(async () => {
    return getAccessToken();
  }, []);

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    setAuthTokens(accessToken, refreshToken);
    setUser(getCurrentUser());
  }, []);

  const signOut = useCallback(() => {
    router.push("/");
    clearAuthCookies();
    setUser(null);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: user !== null,
        getToken,
        setTokens,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
