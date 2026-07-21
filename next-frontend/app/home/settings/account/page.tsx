"use client";

import { AvatarSettings } from "@/components/ui-providers/avatar/AvatarSettings";
import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { useUpdateUser } from "@/components/hooks/user/useUpdateUser";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { useToast } from "@/components/shadcn/use-toast";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { type FC, useState } from "react";

const UsernameRule: FC<{ label: string; valid: boolean; }> = ({
  label,
  valid,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 text-xs",
      valid ? "text-green-600 dark:text-green-500" : "text-muted-foreground",
    )}
  >
    {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    {label}
  </span>
);

const AccountPage: FC = () => {
  const user = useCurrentUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const [username, setUsername] = useState(user.username);

  const hasChanges = username.trim() !== user.username;
  const isValidLength = username.trim().length >= 4;
  const containsSpaces = username.includes(" ");
  const isAlphanumeric = /^[a-zA-Z0-9]*$/.test(username);
  const isValidUsername = isValidLength && !containsSpaces && isAlphanumeric;

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({ username: username.trim() });
      toast({
        description: "Your account settings have been updated",
        title: "Success",
      });
    } catch {
      toast({
        description: "Failed to update account settings",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your account information and preferences.
      </p>

      <div className="space-y-6">
        <AvatarSettings />

        <Card>
          <CardHeader>
            <CardTitle>Display Name</CardTitle>
            <CardDescription>
              This is the name that will be visible to other users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="username">Display Name</Label>
            <Input
              autoComplete="off"
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your display name"
              value={username}
            />
            <div className="flex flex-wrap gap-3">
              <UsernameRule label="4+ characters" valid={isValidLength} />
              <UsernameRule label="No spaces" valid={!containsSpaces} />
              <UsernameRule
                label="Letters & numbers only"
                valid={isAlphanumeric}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              disabled={!hasChanges}
              onClick={() => setUsername(user.username)}
              variant="outline"
            >
              Reset
            </Button>
            <Button
              disabled={!hasChanges || updateUser.isPending || !isValidUsername}
              onClick={handleSave}
            >
              {updateUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AccountPage;
