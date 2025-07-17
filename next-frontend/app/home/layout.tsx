"use client";
import "@/styles/globals.css";

import { useRouter } from "next/navigation";

import "@/styles/globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RecoilRoot } from "recoil";

import { setupAxiosInterceptors } from "@/api/baseApi";
import { useColors } from "@/components/hooks/useColors";
import { SiteHeader } from "@/components/pages/site-header";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Toaster } from "@/components/shadcn/toaster";
import { useAuth } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, useState } from "react";
import { useTags } from "@/components/hooks/tag/useTags";
import { useCategories } from "@/components/hooks/category/useCategory";

interface RootLayoutProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export default function RootLayout({ children }: RootLayoutProps) {
  const auth = useAuth();
  const router = useRouter();

  if (auth.isSignedIn === false) {
    router.push("/");
    return;
  }

  if (auth.isSignedIn === undefined) {
    return (
      <div className="relative flex min-h-screen flex-col">
        {/* Skeleton Navbar */}
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="flex h-16 items-center space-x-4 pl-16 pr-8 sm:justify-between sm:space-x-0">
            <div className="flex w-full flex-row gap-6">
              {/* Logo skeleton */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-6 w-24" />
              </div>

              {/* Navigation skeleton */}
              <div className="flex gap-6">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-18" />
              </div>

              <div className="grow"></div>

              {/* Right side skeleton */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Main content skeleton */}
        <div className="flex grow p-8 gap-6">
          <div className="flex-1 space-y-6">
            {/* KPI Cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
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
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
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
      </div>
    );
  }

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <SpeedInsights />
        <Analytics />
        <AxiosInterceptorWrapper>{children}</AxiosInterceptorWrapper>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

const AxiosInterceptorWrapper = ({ children }: RootLayoutProps) => {
  const auth = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setupAxiosInterceptors(auth.getToken);
    setReady(true);
  }, [auth]);

  // load initially needed data
  useTags();
  useCategories();
  useColors();

  return (
    <div className="relative flex min-h-screen flex-col">
      {ready ? (
        <>
          <SiteHeader />
          <div className="flex grow">{children}</div>
        </>
      ) : (
        <div className="flex grow p-8">
          <div className="flex-1 space-y-6">
            {/* KPI Cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
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
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
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
      )}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};
