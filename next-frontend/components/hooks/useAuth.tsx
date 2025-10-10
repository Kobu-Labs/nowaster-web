import { User } from "@/lib/auth";
import { createContext, useContext } from "react";

type AuthContextType = {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
}
