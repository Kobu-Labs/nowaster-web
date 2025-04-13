import { siteConfig } from "@/config/site";
import { MainNavigation } from "@/components/pages/main-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center space-x-4 pl-16 pr-8 sm:justify-between sm:space-x-0">
        <MainNavigation items={siteConfig.mainNav} />
      </div>
    </header>
  );
}
