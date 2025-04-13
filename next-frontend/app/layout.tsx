"use client";
import "@/styles/globals.css";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import { ThemeProvider } from "@/components/pages/theme-provider";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
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
          <main>
            <ThemeProvider attribute="class" defaultTheme="dark">
              {children}
            </ThemeProvider>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
