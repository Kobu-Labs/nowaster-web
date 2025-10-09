"use client";

import { useAuth } from "@/app/auth-context";
import type { ButtonProps } from "@/components/shadcn/button";
import { Button } from "@/components/shadcn/button";
import Link from "next/link";
import type { FC } from "react";

export const SignInButton: FC<{ label?: string } & ButtonProps> = (props) => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return null;
  }

  return (
    <Link href="/sign-in">
      <Button
        className={props.className}
        size={props.size ?? "sm"}
        variant={props.variant ?? "outline"}
      >
        {props.label ?? "Sign in"}
      </Button>
    </Link>
  );
};
