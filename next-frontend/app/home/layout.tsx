"use client";

import { Providers } from "@/app/home/providers";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";
import { UsernameSelectionDialog } from "@/components/auth/UsernameSelectionDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NewReleaseDialog } from "@/components/release/NewReleaseDialog";
import { HomeHeader } from "@/app/home/HomeHeader";
import { ImpersonationBanner } from "@/components/impersonation/ImpersonationBanner";
import { EnvironmentBanner } from "@/components/environment/EnvironmentBanner";
import { SidebarProvider } from "@/components/shadcn/sidebar";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);

  useEffect(() => {
    const isFirstTime = searchParams.get("firstTime") === "true";
    if (isFirstTime) {
      setShowUsernameDialog(true);
      // Remove the query param from URL
      const newUrl = globalThis.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  const handleUsernameComplete = () => {
    setShowUsernameDialog(false);
  };
  return (
    <Providers>
      <SidebarProvider
        className="flex flex-col [--header-height:3.5rem] p-0"
        defaultOpen={false}
      >
        <UsernameSelectionDialog
          onComplete={handleUsernameComplete}
          open={showUsernameDialog}
        />
        <NewReleaseDialog />
        <HomeHeader />
        <ImpersonationBanner />
        <EnvironmentBanner />
        <SidebarWithPreferences>{children}</SidebarWithPreferences>
      </SidebarProvider>
    </Providers>
  );
}
