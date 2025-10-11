import { useAuth } from "@/components/hooks/useAuth";
import type { FC, PropsWithChildren } from "react";

/**
 * Renders children only when user is authenticated.
 * Waits for auth to load before rendering.
 *
 * @example
 * <SignedIn>
 *   <ProfileButton />
 * </SignedIn>
 */
export const SignedIn: FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoaded } = useAuth();

  if (!isLoaded || !user) return null;

  return children;
};
