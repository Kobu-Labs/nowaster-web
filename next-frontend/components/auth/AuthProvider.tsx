"use client";

import { setupAxiosInterceptors } from "@/api/baseApi";
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load user from token on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setupAxiosInterceptors(getToken, setTokens);
    setIsLoaded(true);
  }, []);

  const getToken = useCallback(async () => {
    return getAccessToken();
  }, []);

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    setAuthTokens(accessToken, refreshToken);

    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const signOut = useCallback(() => {
    router.push("/");
    clearAuthCookies();
    setUser(null);
  }, []);

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
