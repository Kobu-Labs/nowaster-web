import { User } from "@/lib/auth";
import { createContext, useContext } from "react";

type AuthContextType = {
  getToken: () => Promise<null | string>;
  isLoaded: boolean;
  isSignedIn: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
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
