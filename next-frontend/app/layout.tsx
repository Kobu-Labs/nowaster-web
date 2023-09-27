"use client";

import "@/styles/globals.css";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { RecoilRoot } from "recoil";


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
              "bg-background min-h-screen font-sans antialiased",
              fontSans.variable
            )}
          >
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1">{children}</div>
              </div>
            </ThemeProvider>
          </body>
        </html>
      </ReactQueryProvider>
    </RecoilRoot>
  );
}
