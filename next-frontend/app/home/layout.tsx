"use client";
import "@/styles/globals.css";

import { useRouter } from "next/navigation";

import "@/styles/globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RecoilRoot } from "recoil";

import { SiteHeader } from "@/components/pages/site-header";
import { Toaster } from "@/components/shadcn/toaster";
import { ReactQueryProvider } from "@/app/ReactQueryProvider";
import { useAuth } from "@clerk/nextjs";
import { setupAxiosInterceptors } from "@/api/baseApi";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { LoaderCircle } from "lucide-react";
import { useColors } from "@/components/hooks/useColors";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

interface RootLayoutProps {
  children: React.ReactNode;
}

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
      <ReactQueryProvider>
        <SpeedInsights />
        <Analytics />
        <AxiosInterceptorWrapper>{children}</AxiosInterceptorWrapper>
      </ReactQueryProvider>
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

  // load initial colors
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
