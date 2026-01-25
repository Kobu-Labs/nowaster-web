"use client";

import { AuthContext } from "@/components/hooks/useAuth";
import { env } from "@/env";
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
  useRef,
  useState,
} from "react";

const isSandboxEnv = env.NEXT_PUBLIC_APP_ENV === "nowaster-sandbox";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<null | User>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const guestLoginAttempted = useRef(false);

  useEffect(() => {
    async function initAuth() {
      const currentUser = getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsLoaded(true);
        return;
      }

      if (isSandboxEnv && !guestLoginAttempted.current) {
        guestLoginAttempted.current = true;

        try {
          const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/guest`, {
            credentials: "include",
            method: "POST",
          });

          if (res.ok) {
            const data = (await res.json()) as {
              data?: { access_token: string; };
            };
            if (data.data) {
              setUserFromToken(data.data.access_token);
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

  const setTokens = useCallback((accessToken: string) => {
    setUserFromToken(accessToken);
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
