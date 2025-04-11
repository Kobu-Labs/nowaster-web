import { Button, ButtonProps } from "@/components/shadcn/button";
import { SignedOut } from "@clerk/nextjs";
import { FC } from "react";

export const SignInButton: FC<ButtonProps & {label?:string}> = (props) => {
  return (
    <SignedOut>
      <SignInButton>
        <Button
          variant={props.variant ?? "outline"}
          size={props.size ?? "sm"}
          className={props.className}
        >
          {props.label ?? "Start your journey now"}
        </Button>
      </SignInButton>
    </SignedOut>
  );
};
