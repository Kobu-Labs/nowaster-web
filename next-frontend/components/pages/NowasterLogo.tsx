"use client";

import { useSidebar } from "@/components/shadcn/sidebar";
import Image from "next/image";
import Link from "next/link";
import type { FC, PropsWithChildren } from "react";

export const NowasterLogo: FC<PropsWithChildren<{ href?: string; }>> = (
  props,
) => {
  const { setOpen } = useSidebar();

  return (
    <Link
      className="flex items-center space-x-2 hover:scale-110 hover:transition"
      href={props.href ?? "/"}
      onClick={() => {
        setOpen(false);
      }}
    >
      <Image
        alt="Logo"
        className="h-8 w-8"
        height={80}
        src="/logo.png"
        width={80}
      />
      {props.children}
    </Link>
  );
};
