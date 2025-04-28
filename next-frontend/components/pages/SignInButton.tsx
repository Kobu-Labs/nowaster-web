import { Button, ButtonProps } from "@/components/shadcn/button";
import { SignedOut, SignInButton as SignInButtonClerk } from "@clerk/nextjs";
import { FC } from "react";

export const SignInButton: FC<ButtonProps & { label?: string }> = (props) => {
  return (
    <SignedOut>
      <SignInButtonClerk>
        <Button
          variant={props.variant ?? "outline"}
          size={props.size ?? "sm"}
          className={props.className}
        >
          {props.label ?? "Start your journey now"}
        </Button>
      </SignInButtonClerk>
    </SignedOut>
  );
};
