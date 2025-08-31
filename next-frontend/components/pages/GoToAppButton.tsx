"use client";
import type { ButtonProps } from "@/components/shadcn/button";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/nextjs";
import { ArrowBigRight } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

export const GoToAppButton: FC<{ label?: string } & ButtonProps> = (props) => {
  return (
    <SignedIn>
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
    </SignedIn>
  );
};
