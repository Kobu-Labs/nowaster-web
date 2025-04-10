"use client";

import "@/styles/globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RecoilRoot } from "recoil";

import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/pages/site-header";
import { ThemeProvider } from "@/components/pages/theme-provider";
import { Toaster } from "@/components/shadcn/toaster";
import { ReactQueryProvider } from "@/app/ReactQueryProvider";
import Head from "next/head";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <RecoilRoot>
      <ReactQueryProvider>
        <html lang="en" suppressHydrationWarning>
          <Head>
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/favicon-32x32.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="16x16"
              href="/favicon-16x16.png"
            />
          </Head>
          <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              fontSans.variable,
            )}
          >
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex grow">{children}</main>
                <Toaster />
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            </ThemeProvider>
          </body>
        </html>
      </ReactQueryProvider>
    </RecoilRoot>
  );
}
