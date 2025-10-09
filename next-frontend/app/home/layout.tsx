import { Providers } from "@/app/home/providers";
import { SidebarWithPreferences } from "@/components/pages/SidebarWithPreferences";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Providers>
      <SidebarWithPreferences>{children}</SidebarWithPreferences>
    </Providers>
  );
}
