"use client";

import { PropsWithChildren, type FC } from "react";
import { useImpersonation } from "@/components/hooks/useImpersonation";
import { useSearchUsers } from "@/components/hooks/useSearchUsers";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Loader2, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { TogglableTooltip } from "@/components/ui-providers/TogglableTooltip";

export const AdminImpersonation: FC = () => {
  const { startImpersonation, isStarting } = useImpersonation();
  const { searchQuery, setSearchQuery, users, isLoading } = useSearchUsers();
  const { user: currentUser } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Impersonation</CardTitle>
        <CardDescription>
          Search for a user by ID or username to impersonate them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by user ID or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isStarting}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const isAdmin = user.role === "admin";
                const cannotImpersonate = isCurrentUser || isAdmin;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.username}</p>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                          {isAdmin && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.id}
                        </p>
                      </div>
                    </div>
                    <TogglableTooltip
                      showTooltip={cannotImpersonate}
                      tooltipContent={
                        isCurrentUser
                          ? "Cannot impersonate yourself"
                          : isAdmin
                            ? "Cannot impersonate admin users"
                            : undefined
                      }
                    >
                      <Button
                        onClick={() => startImpersonation(user.id)}
                        size="sm"
                        disabled={cannotImpersonate}
                      >
                        {isStarting ? "Starting..." : "Impersonate"}
                      </Button>
                    </TogglableTooltip>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && searchQuery && users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
