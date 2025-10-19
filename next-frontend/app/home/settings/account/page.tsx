"use client";

import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { useUpdateUser } from "@/components/hooks/user/useUpdateUser";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { getInitials, cn } from "@/lib/utils";
import { Check, Loader2, Upload, X } from "lucide-react";
import { useState, type FC } from "react";
import { useToast } from "@/components/shadcn/use-toast";

const AccountPage: FC = () => {
  const user = useCurrentUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const [username, setUsername] = useState(user.username);

  const handleSave = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (username.trim().length < 4) {
      toast({
        title: "Error",
        description: "Display name must be at least 4 characters",
        variant: "destructive",
      });
      return;
    }

    if (username.includes(" ")) {
      toast({
        title: "Error",
        description: "Display name cannot contain spaces",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      toast({
        title: "Error",
        description: "Display name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateUser.mutateAsync({ username: username.trim() });
      toast({
        title: "Success",
        description: "Your account settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account settings",
        variant: "destructive",
      });
    }
  };

  const hasChanges = username.trim() !== user.username;
  const isValidLength = username.trim().length >= 4;
  const containsSpaces = username.includes(" ");
  const isAlphanumeric = /^[a-zA-Z0-9]*$/.test(username);
  const isValidUsername = isValidLength && !containsSpaces && isAlphanumeric;

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences.
          </p>
        </div>

        <div className="space-y-6 bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-upload">Profile Picture</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a new profile picture
                </p>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button disabled size="sm" variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming soon! (once I learn AWS S3)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input
                autoComplete="off"
                id="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your display name"
                type="text"
                value={username}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isValidLength ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
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
                  {!containsSpaces ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <p
                    className={cn(
                      "text-sm",
                      !containsSpaces ? "text-green-500" : "text-red-500",
                    )}
                  >
                    No spaces
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAlphanumeric ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
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
              <p className="text-sm text-muted-foreground">
                This is the name that will be visible to other users.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
