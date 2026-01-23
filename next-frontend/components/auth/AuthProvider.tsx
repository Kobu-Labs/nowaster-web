"use client";

import { AuthContext } from "@/components/hooks/useAuth";
import { env } from "@/env";
import {
  clearAuthCookies,
  getAccessToken,
  getCurrentUser,
  setAuthTokens,
  type User,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const isSandboxEnv = env.NEXT_PUBLIC_APP_ENV === "nowaster-sandbox";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  // Start with null to avoid hydration mismatch
  const [user, setUser] = useState<null | User>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const guestLoginAttempted = useRef(false);

  useEffect(() => {
    async function initAuth() {
      const currentUser = getCurrentUser();

      if (currentUser) {
        // User already logged in
        setUser(currentUser);
        setIsLoaded(true);
        return;
      }

      // Auto-login for sandbox environment
      if (isSandboxEnv && !guestLoginAttempted.current) {
        guestLoginAttempted.current = true;

        try {
          const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/guest`, {
            credentials: "include",
            method: "POST",
          });

          if (res.ok) {
            const data = (await res.json()) as {
              data?: { access_token: string; refresh_token: string };
            };
            if (data.data) {
              setAuthTokens(data.data.access_token, data.data.refresh_token);
              setUser(getCurrentUser());
            }
          } else {
            console.warn("Sandbox guest login failed:", res.statusText);
          }
        } catch (err) {
          console.error("Sandbox auto-login error:", err);
        }
      }

      setIsLoaded(true);
    }

    void initAuth();
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
        getToken,
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
