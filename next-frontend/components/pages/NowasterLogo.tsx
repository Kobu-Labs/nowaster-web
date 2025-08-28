"use client";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import Image from "next/image";
import { FC } from "react";
import { useSidebar } from "@/components/shadcn/sidebar";

export const NowasterLogo: FC<{ href?: string }> = (props) => {
  const { setOpen } = useSidebar();

  return (
    <Link
      href={props.href ?? "/"}
      className="flex items-center space-x-2 hover:scale-110 hover:transition"
      onClick={() => setOpen(false)}
    >
      <Image
        src="/logo.png"
        alt="Logo"
        className="h-8 w-8"
        width={80}
        height={80}
      />
      <span className="inline-block font-bold">{siteConfig.name}</span>
    </Link>
  );
};
