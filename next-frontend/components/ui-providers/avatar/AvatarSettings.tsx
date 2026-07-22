"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { UserAvatarThumb } from "@/components/ui-providers/avatar/UserAvatarThumb";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { format } from "date-fns";
import Link from "next/link";
import { type FC } from "react";

export const AvatarSettings: FC = () => {
  const user = useCurrentUser();
  const { data: avatar, isLoading } = useAvatar();

  const isEnabled = avatar?.isEnabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>
          AI-generated avatar based on your tracked activity
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading
          ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-8 w-40" />
              </div>
            )
          : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatarThumb
                    avatarClassName="h-14 w-14"
                    username={user.username}
                  />
                  <div className="space-y-1">
                    <Badge variant={isEnabled ? "default" : "outline"}>
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {isEnabled && avatar?.lastGeneratedAt && (
                      <p className="text-sm text-muted-foreground">
                        Last generated
                        {" "}
                        {format(avatar.lastGeneratedAt, "PPP")}
                      </p>
                    )}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/home/settings/avatar">Manage avatar</Link>
                </Button>
              </div>
            )}
      </CardContent>
    </Card>
  );
};
