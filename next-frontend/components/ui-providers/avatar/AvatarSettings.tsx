"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useAvatarDisable } from "@/components/hooks/avatar/useAvatarDisable";
import { useAvatarEnable } from "@/components/hooks/avatar/useAvatarEnable";
import { useLatestRun } from "@/components/hooks/avatar/useLatestRun";
import { useTriggerGeneration } from "@/components/hooks/avatar/useTriggerGeneration";
import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { PresetSelectorDialog } from "@/components/ui-providers/avatar/PresetSelectorDialog";
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
import { Switch } from "@/components/shadcn/switch";
import { useToast } from "@/components/shadcn/use-toast";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";

export const AvatarSettings: FC = () => {
  const user = useCurrentUser();
  const { data: avatar, isLoading } = useAvatar();
  const { data: latestRun } = useLatestRun();
  const enable = useAvatarEnable();
  const disable = useAvatarDisable();
  const generate = useTriggerGeneration();
  const { toast } = useToast();

  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const pendingEnable = useRef(false);

  const previousStatus = useRef(latestRun?.status);

  useEffect(() => {
    const prev = previousStatus.current;
    const current = latestRun?.status;

    if (prev === "running" && current === "success") {
      toast({ description: "New avatar generated successfully", title: "Done" });
    } else if (prev === "running" && current === "failed") {
      toast({
        description: latestRun?.errorMessage ?? "Generation failed",
        title: "Error",
        variant: "destructive",
      });
    }

    previousStatus.current = current;
  }, [latestRun?.status, latestRun?.errorMessage, toast]);

  const runEnable = async () => {
    try {
      await enable.mutateAsync();
    } catch {
      toast({
        description: "Failed to update avatar settings",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      try {
        await disable.mutateAsync();
      } catch {
        toast({
          description: "Failed to update avatar settings",
          title: "Error",
          variant: "destructive",
        });
      }
      return;
    }

    if (!avatar?.basePresetId) {
      pendingEnable.current = true;
      setPresetDialogOpen(true);
      return;
    }

    await runEnable();
  };

  const handlePresetSelected = async () => {
    if (pendingEnable.current) {
      pendingEnable.current = false;
      await runEnable();
    }
  };

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync();
    } catch (e) {
      toast({
        description: e instanceof Error ? e.message : "Generation failed",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const isEnabled = avatar?.isEnabled ?? false;
  const onCooldown
    = !!avatar?.nextGenerationAt && avatar.nextGenerationAt > new Date();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              AI-generated avatar based on your tracked activity
            </CardDescription>
          </div>
          {isLoading
            ? (
                <Skeleton className="h-6 w-10 rounded-full" />
              )
            : (
                <Switch
                  checked={isEnabled}
                  disabled={enable.isPending || disable.isPending}
                  onCheckedChange={handleToggle}
                />
              )}
        </CardHeader>

        <CardContent>
          {isLoading
            ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-10 w-48" />
                </div>
              )
            : (
                <div className="flex items-center gap-4">
                  <UserAvatarThumb avatarClassName="h-20 w-20" username={user.username} />

                  <div className="space-y-2">
                    {isEnabled
                      ? (
                          <>
                            {latestRun?.completedAt && (
                              <p className="text-sm text-muted-foreground">
                                Last generated
                                {" "}
                                {format(latestRun.completedAt, "PPP")}
                              </p>
                            )}

                            {avatar?.nextGenerationAt && (
                              <p className="text-sm text-muted-foreground">
                                {onCooldown
                                  ? `Next generation available ${format(avatar.nextGenerationAt, "PPP")}`
                                  : "Ready to regenerate"}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <Button
                                disabled={generate.isPending || onCooldown}
                                onClick={handleGenerate}
                                size="sm"
                                variant="outline"
                              >
                                {generate.isPending
                                  ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )
                                  : (
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                Regenerate
                              </Button>
                              <Button
                                onClick={() => setPresetDialogOpen(true)}
                                size="sm"
                                variant="outline"
                              >
                                Change default avatar
                              </Button>
                            </div>

                            {latestRun?.status === "running" && (
                              <Badge variant="secondary">
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Generating…
                              </Badge>
                            )}
                          </>
                        )
                      : (
                          <p className="text-sm text-muted-foreground">
                            Turn on to choose a default avatar and start generating
                            one from your tracked time.
                          </p>
                        )}
                  </div>
                </div>
              )}
        </CardContent>
      </Card>

      <PresetSelectorDialog
        currentPresetId={avatar?.basePresetId ?? null}
        onOpenChange={(next) => {
          setPresetDialogOpen(next);
          if (!next) {
            pendingEnable.current = false;
          }
        }}
        onSelected={handlePresetSelected}
        open={presetDialogOpen}
      />
    </>
  );
};
