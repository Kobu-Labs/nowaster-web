"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useCategories } from "@/components/hooks/category/useCategory";
import { useTags } from "@/components/hooks/tag/useTags";
import { useColors } from "@/components/hooks/useColors";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/shadcn/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { FC } from "react";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
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
  );
}

const PrefetchQueries: FC = () => {
  useTags();
  useCategories();
  useColors();

  return null;
};
