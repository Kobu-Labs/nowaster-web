import { Providers } from "@/app/home/providers";
import { HomeHeader } from "@/app/home/HomeHeader";
import { EnvironmentBanner } from "@/components/environment/EnvironmentBanner";
import { ImpersonationBanner } from "@/components/impersonation/ImpersonationBanner";
import { NewReleaseDialog } from "@/components/release/NewReleaseDialog";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";
import { UsernameSelectionDialog } from "@/components/auth/UsernameSelectionDialog";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import type { User } from "@/lib/auth";
import { cookies } from "next/headers";
import { Suspense } from "react";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const userHint = cookieStore.get("user_hint")?.value;
  let initialUser: null | User = null;
  if (userHint) {
    try {
      initialUser = JSON.parse(userHint) as User;
    } catch {
      // invalid cookie value — treat as unauthenticated
    }
  }

  return (
    <Providers initialUser={initialUser}>
      <SidebarProvider
        className="flex flex-col [--header-height:3.5rem] p-0"
        defaultOpen={false}
      >
        <Suspense fallback={null}>
          <UsernameSelectionDialog />
        </Suspense>
        <NewReleaseDialog />
        <HomeHeader />
        <ImpersonationBanner />
        <EnvironmentBanner />
        <SidebarWithPreferences>{children}</SidebarWithPreferences>
      </SidebarProvider>
    </Providers>
  );
}
