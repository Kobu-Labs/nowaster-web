"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useCategories } from "@/components/hooks/category/useCategory";
import { useTags } from "@/components/hooks/tag/useTags";
import { useColors } from "@/components/hooks/useColors";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@/lib/auth";
import { Toaster } from "@/components/shadcn/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { FC } from "react";

type ProvidersProps = {
  children: React.ReactNode;
  initialUser: null | User;
};

export function Providers({ children, initialUser }: ProvidersProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      <QueryClientProvider client={queryClient}>
        <SpeedInsights />
        <Analytics />
        <AuthGuard>
          <PrefetchQueries />
          {children}
        </AuthGuard>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

const PrefetchQueries: FC = () => {
  useTags();
  useCategories();
  useColors();

  return null;
};
