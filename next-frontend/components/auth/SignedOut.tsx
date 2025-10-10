import { useAuth } from "@/components/hooks/useAuth";
import type { FC, PropsWithChildren } from "react";

/**
 * Renders children only when user is NOT authenticated.
 * Waits for auth to load before rendering.
 *
 * @example
 * <SignedOut>
 *   <SignInButton />
 * </SignedOut>
 */
export const SignedOut: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();

  if (user) return null;

  return children;
};
