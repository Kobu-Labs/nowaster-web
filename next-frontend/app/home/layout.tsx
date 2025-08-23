"use server";

import { HomeHeader } from "@/app/home/HomeHeader";
import { Providers } from "@/app/home/providers";
import { AppSidebar } from "@/components/pages/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";
import { auth } from "@clerk/nextjs/server";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn();
    return;
  }

  return (
    <Providers>
      <SidebarWithPreferences>
        {children}
      </SidebarWithPreferences>
    </Providers>
  );
}
