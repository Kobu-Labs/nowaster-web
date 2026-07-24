"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useAvatarDisable } from "@/components/hooks/avatar/useAvatarDisable";
import { useAvatarEnable } from "@/components/hooks/avatar/useAvatarEnable";
import { useLatestRun } from "@/components/hooks/avatar/useLatestRun";
import { useSetPreset } from "@/components/hooks/avatar/useSetPreset";
import { useTriggerGeneration } from "@/components/hooks/avatar/useTriggerGeneration";
import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { AvatarOnboardingGrid } from "@/components/ui-providers/avatar/AvatarOnboardingGrid";
import { PresetSelectorDialog } from "@/components/ui-providers/avatar/PresetSelectorDialog";
import { UserAvatarThumb } from "@/components/ui-providers/avatar/UserAvatarThumb";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
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
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";

export const AvatarHero: FC = () => {
  const user = useCurrentUser();
  const { data: avatar, isLoading } = useAvatar();
  const { data: latestRun } = useLatestRun();
  const enable = useAvatarEnable();
  const disable = useAvatarDisable();
  const generate = useTriggerGeneration();
  const setPreset = useSetPreset();
  const { toast } = useToast();

  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
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

  const isEnabled = avatar?.isEnabled ?? false;
  const hasPreset = !!avatar?.basePresetId;
  const isGenerating
    = generate.isPending || latestRun?.status === "running";
  const availableGenerations = avatar?.availableGenerations ?? 0;
  const outOfGenerations = availableGenerations <= 0;
  const settingUp = setPreset.isPending || enable.isPending;

  const handleDisable = async () => {
    try {
      await disable.mutateAsync();
    } catch {
      toast({
        description: "Failed to update avatar settings",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleEnable = async () => {
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
    if (checked) {
      await handleEnable();
    } else {
      await handleDisable();
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

  const handlePickStartingPreset = async (presetId: string) => {
    try {
      await setPreset.mutateAsync(presetId);
      await enable.mutateAsync();
    } catch {
      toast({
        description: "Failed to set up avatar",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          {isLoading
            ? (
                <Skeleton className="h-5 w-9 rounded-full" />
              )
            : (
                <Switch
                  checked={isEnabled}
                  disabled={
                    enable.isPending
                    || disable.isPending
                    || (!isEnabled && !hasPreset)
                  }
                  onCheckedChange={handleToggle}
                />
              )}
          <div>
            <CardTitle>Avatar generation</CardTitle>
            <CardDescription>
              {isEnabled
                ? "On — your avatar updates automatically from your tracked activity"
                : "Off — turn on to generate an avatar from your tracked activity"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading
            ? (
                <div className="flex items-center gap-6">
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <Skeleton className="h-10 w-48" />
                </div>
              )
            : isEnabled
              ? (
                  <div className="flex items-center gap-6">
                    <UserAvatarThumb
                      avatarClassName="h-28 w-28"
                      username={user.username}
                    />

                    <div className="space-y-2">
                      {latestRun?.completedAt && (
                        <p className="text-sm text-muted-foreground">
                          Last generated
                          {" "}
                          {format(latestRun.completedAt, "PPP")}
                        </p>
                      )}

                      <p className="text-sm text-muted-foreground">
                        {outOfGenerations
                          ? "No generations available"
                          : `${availableGenerations} generation${availableGenerations === 1 ? "" : "s"} available`}
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          disabled={isGenerating || outOfGenerations}
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
                          disabled={isGenerating}
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
                    </div>
                  </div>
                )
              : hasPreset
                ? (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        {avatar?.currentThumbUrl && (
                          <AvatarImage
                            alt={user.username}
                            src={avatar.currentThumbUrl}
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-sm font-medium">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-muted-foreground">
                        Avatar generation is off. Turn it back on above to
                        keep generating from your current character.
                      </p>
                    </div>
                  )
                : (
                    <AvatarOnboardingGrid
                      isPending={settingUp}
                      onSelect={handlePickStartingPreset}
                    />
                  )}
        </CardContent>
      </Card>

      <PresetSelectorDialog
        currentPresetId={avatar?.basePresetId ?? null}
        onOpenChange={setPresetDialogOpen}
        open={presetDialogOpen}
      />
    </>
  );
};
