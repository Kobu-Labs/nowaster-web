"use client";
import { Skeleton } from "@/components/shadcn/skeleton";

import { setupAxiosInterceptors } from "@/api/baseApi";
import {
  clearAuthCookies,
  getAccessToken,
  getCurrentUser,
  setAuthTokens,
  type User,
} from "@/lib/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: FC<PropsWithChildren> = ({ children }) => {
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
      {isLoaded ? children : <AppSpinner />}
    </AuthContext.Provider>
  );
};

const AppSpinner: FC = () => {
  return (
    <div className="flex grow p-8">
      <div className="flex-1 space-y-6">
        {/* KPI Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="rounded-lg border bg-card p-6" key={i}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart area skeleton */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 pb-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="px-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="flex items-center justify-between py-2" key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 pt-4">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
}
