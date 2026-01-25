import { User } from "@/lib/auth";
import { createContext, useContext } from "react";

type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  setTokens: (accessToken: string) => void;
  signOut: () => void;
  user: null | User;
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
