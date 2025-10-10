"use client";

import { AuthContextProvider } from "@/app/auth-context";
import { useCategories } from "@/components/hooks/category/useCategory";
import { useTags } from "@/components/hooks/tag/useTags";
import { useColors } from "@/components/hooks/useColors";
import { ThemeProvider } from "@/components/pages/theme-provider";
import { Toaster } from "@/components/shadcn/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { FC } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthContextProvider>
      <QueryClientProvider client={queryClient}>
        <SpeedInsights />
        <Analytics />
        <PrefetchQueries />
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
      </QueryClientProvider>
    </AuthContextProvider>
  );
}

const PrefetchQueries: FC = () => {
  useTags();
  useCategories();
  useColors();

  return null;
};
