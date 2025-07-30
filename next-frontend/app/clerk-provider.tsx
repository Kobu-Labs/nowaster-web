import { env } from "@/env";
import { ClerkProvider } from "@clerk/nextjs";
import { FC, PropsWithChildren } from "react";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      signUpFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
      }
      signInFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
      }
    >
      {children}
    </ClerkProvider>
  );
};
