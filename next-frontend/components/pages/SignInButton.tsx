import type { ButtonProps } from "@/components/shadcn/button";
import { Button } from "@/components/shadcn/button";
import { SignedOut, SignInButton as SignInButtonClerk } from "@clerk/nextjs";
import type { FC } from "react";

export const SignInButton: FC<{ label?: string } & ButtonProps> = (props) => {
  return (
    <SignedOut>
      <SignInButtonClerk>
        <Button
          className={props.className}
          size={props.size ?? "sm"}
          variant={props.variant ?? "outline"}
        >
          {props.label ?? "Sign in"}
        </Button>
      </SignInButtonClerk>
    </SignedOut>
  );
};
