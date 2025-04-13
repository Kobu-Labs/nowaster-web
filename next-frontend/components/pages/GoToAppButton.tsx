"use client";
import { Button, ButtonProps } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/nextjs";
import { ArrowBigRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const GoToAppButton: FC<ButtonProps & { label?: string }> = (props) => {
  return (
    <SignedIn>
      <Button
        variant={props.variant ?? "outline"}
        size={props.size ?? "sm"}
        className={cn(
          "flex items-center justify-center gap-2",
          props.className,
        )}
      >
        <Link href="/home/">{props.label ?? "Go to application"}</Link>
        <ArrowBigRight />
      </Button>
    </SignedIn>
  );
};
