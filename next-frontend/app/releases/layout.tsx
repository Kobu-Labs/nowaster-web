import { SiteHeader } from "@/components/pages/site-header";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ReleasesLayout({ children }: Props) {
  return (
    <div className="min-h-screen ">
      <SiteHeader />
      <div className="min-h-screen flex flex-col  px-8 items-start">
        {children}
      </div>
    </div>
  );
}
