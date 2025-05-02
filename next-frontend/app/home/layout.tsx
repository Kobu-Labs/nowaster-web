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
import { LoaderCircle } from "lucide-react";
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
      <div className="flex items-center justify-center  w-full grow h-screen m-20">
        <Skeleton className="w-full grow h-svh m-20" />
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
        <Skeleton className="flex items-center justify-center  w-full grow h-screen m-20">
          <LoaderCircle strokeWidth={1} className="h-1/2 w-1/2 animate-spin" />
        </Skeleton>
      )}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};
