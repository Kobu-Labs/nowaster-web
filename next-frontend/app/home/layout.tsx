"use server";

import { redirect } from "next/navigation";
import { HomeHeader } from "@/app/home/HomeHeader";
import { Providers } from "@/app/home/providers";
import { AppSidebar } from "@/components/pages/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";
import { auth } from "@clerk/nextjs/server";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <Providers>
      <SidebarProvider
        defaultOpen={true}
        className="flex flex-col [--header-height:3.5rem]"
      >
        <HomeHeader />
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}
