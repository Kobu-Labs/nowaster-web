"use client";

import { useAuth } from "@/app/auth-context";
import type { ButtonProps } from "@/components/shadcn/button";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { ArrowBigRight } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

export const GoToAppButton: FC<{ label?: string } & ButtonProps> = (props) => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return null;
  }

  return (
    <Button
      asChild
      className={cn(
        "flex items-center justify-center gap-2",
        props.className,
      )}
      size={props.size ?? "sm"}
      variant={props.variant ?? "outline"}
    >
      <Link href="/home/">
        <p>{props.label ?? "Go to application"}</p>
        <ArrowBigRight />
      </Link>
    </Button>
  );
};
