"use client";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import Image from "next/image";
import type { FC } from "react";
import { useSidebar } from "@/components/shadcn/sidebar";

export const NowasterLogo: FC<{ href?: string; }> = (props) => {
  const { setOpen } = useSidebar();

  return (
    <Link
      className="flex items-center space-x-2 hover:scale-110 hover:transition"
      href={props.href ?? "/"}
      onClick={() => { setOpen(false); }}
    >
      <Image
        alt="Logo"
        className="h-8 w-8"
        height={80}
        src="/logo.png"
        width={80}
      />
      <span className="inline-block font-bold">{siteConfig.name}</span>
    </Link>
  );
};
