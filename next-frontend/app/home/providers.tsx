"use client";

import { setupAxiosInterceptors } from "@/api/baseApi";
import { AuthProvider } from "@/app/clerk-provider";
import { useCategories } from "@/components/hooks/category/useCategory";
import { useTags } from "@/components/hooks/tag/useTags";
import { useColors } from "@/components/hooks/useColors";
import { ThemeProvider } from "@/components/pages/theme-provider";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Toaster } from "@/components/shadcn/toaster";
import { useAuth } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { FC, PropsWithChildren} from "react";
import { useEffect, useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export function Providers({ children }: ProvidersProps) {
  return (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SpeedInsights />
          <Analytics />
          <AxiosInterceptorWrapper>
            <ThemeProvider attribute="class" defaultTheme="dark">
              {children}
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster />
          </AxiosInterceptorWrapper>
        </QueryClientProvider>
      </AuthProvider>
  );
}

const AxiosInterceptorWrapper: FC<PropsWithChildren> = ({ children }) => {
  const auth = useAuth();
  const [ready, setReady] = useState(false);

  // INFO: wait for clerk to load
  useEffect(() => {
    setupAxiosInterceptors(auth.getToken);
    setReady(true);
  }, [auth.userId]);

  // load initially needed data
  useTags();
  useCategories();
  useColors();

  if (ready) {
    return children;
  }

  return (
    <div className="flex grow p-8">
      <div className="flex-1 space-y-6">
        {/* KPI Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="rounded-lg border bg-card p-6" key={i}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart area skeleton */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 pb-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="px-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="flex items-center justify-between py-2" key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 pt-4">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
