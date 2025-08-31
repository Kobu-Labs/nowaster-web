import { env } from "@/env";
import { ClerkProvider } from "@clerk/nextjs";
import type { FC, PropsWithChildren } from "react";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
      }
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
      }
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    >
      {children}
    </ClerkProvider>
  );
};
