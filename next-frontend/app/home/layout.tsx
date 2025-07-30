"use server";

import { HomeHeader } from "@/app/home/HomeHeader";
import { Providers } from "@/app/home/providers";
import { AppSidebar } from "@/components/pages/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";
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
      <SidebarProvider
        defaultOpen={false}
        className="flex flex-col [--header-height:3.5rem]"
      >
        <HomeHeader />
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}
