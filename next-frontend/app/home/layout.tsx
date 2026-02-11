"use client";

import { Providers } from "@/app/home/providers";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";
import { UsernameSelectionDialog } from "@/components/auth/UsernameSelectionDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { NewReleaseDialog } from "@/components/release/NewReleaseDialog";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Providers>
      <Suspense fallback={null}>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </Providers>
  );
}

function LayoutContent({ children }: RootLayoutProps) {
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
    <>
      <UsernameSelectionDialog
        onComplete={handleUsernameComplete}
        open={showUsernameDialog}
      />
      <NewReleaseDialog />
      <SidebarWithPreferences>{children}</SidebarWithPreferences>
    </>
  );
}
