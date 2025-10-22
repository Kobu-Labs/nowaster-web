"use client";

import { useUpdateUser } from "@/components/hooks/user/useUpdateUser";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { useToast } from "@/components/shadcn/use-toast";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { type FC, useState } from "react";

type UsernameSelectionDialogProps = {
  onComplete: () => void;
  open: boolean;
};

export const UsernameSelectionDialog: FC<UsernameSelectionDialogProps> = ({
  onComplete,
  open,
}) => {
  const [username, setUsername] = useState("");
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const isValidLength = username.trim().length >= 4;
  const containsSpaces = username.includes(" ");
  const isAlphanumeric = /^[a-zA-Z0-9]*$/.test(username);
  const isValidUsername = isValidLength && !containsSpaces && isAlphanumeric;

  const handleSubmit = async () => {
    if (!isValidUsername) {
      return;
    }

    try {
      await updateUser.mutateAsync({ username: username.trim() });
      toast({
        description: "Your username has been set successfully",
        title: "Welcome!",
      });
      onComplete();
    } catch {
      toast({
        description: "Failed to set username. Please try again.",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose Your Username</DialogTitle>
          <DialogDescription>
            Welcome! Please choose a username for your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              autoComplete="off"
              autoFocus
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValidUsername) {
                  void handleSubmit();
                }
              }}
              placeholder="Enter your username"
              type="text"
              value={username}
            />

            {username.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-2">
                  {isValidLength
                    ? (
                        <Check className="h-4 w-4 text-green-500" />
                      )
                    : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                  <p
                    className={cn(
                      "text-sm",
                      isValidLength ? "text-green-500" : "text-red-500",
                    )}
                  >
                    At least 4 characters
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {containsSpaces
                    ? (
                        <X className="h-4 w-4 text-red-500" />
                      )
                    : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                  <p
                    className={cn(
                      "text-sm",
                      containsSpaces ? "text-red-500" : "text-green-500",
                    )}
                  >
                    No spaces
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAlphanumeric
                    ? (
                        <Check className="h-4 w-4 text-green-500" />
                      )
                    : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                  <p
                    className={cn(
                      "text-sm",
                      isAlphanumeric ? "text-green-500" : "text-red-500",
                    )}
                  >
                    Only letters and numbers
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!isValidUsername || updateUser.isPending}
            onClick={handleSubmit}
          >
            {updateUser.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
