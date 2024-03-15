"use client";

import "@/styles/globals.css";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/app/ReactQueryProvider";
import { RecoilRoot } from "recoil";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/pages/theme-provider";
import { SiteHeader } from "@/components/pages/site-header";
import { Toaster } from "@/components/shadcn/toaster";


interface RootLayoutProps {
  children: React.ReactNode
}


export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <RecoilRoot>
      <ReactQueryProvider>
        <html lang="en" suppressHydrationWarning>
          <head />
          <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              fontSans.variable
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
