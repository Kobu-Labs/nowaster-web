"use server";

import { Providers } from "@/app/home/providers";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";
import { auth } from "@clerk/nextjs/server";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { redirectToSignIn, userId } = await auth();

  if (!userId) {
    redirectToSignIn();
    return;
  }

  return (
    <Providers>
      <SidebarWithPreferences>{children}</SidebarWithPreferences>
    </Providers>
  );
}
