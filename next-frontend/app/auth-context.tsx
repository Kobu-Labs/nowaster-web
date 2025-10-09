"use client";

import {
  clearAuthCookies,
  getCurrentUser,
  getAccessToken,
  setAuthTokens,
  type User,
} from "@/lib/auth";
import { Loader2 } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type FC,
  type PropsWithChildren,
} from "react";

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

  useEffect(() => {
    // Load user from token on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
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
    clearAuthCookies();
    setUser(null);
    window.location.href = "/";
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
      {isLoaded ? (
        children
      ) : (
        <div className="h-screen flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
}
