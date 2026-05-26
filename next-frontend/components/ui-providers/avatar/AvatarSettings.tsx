"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useAvatarDisable } from "@/components/hooks/avatar/useAvatarDisable";
import { useAvatarEnable } from "@/components/hooks/avatar/useAvatarEnable";
import { useLatestRun } from "@/components/hooks/avatar/useLatestRun";
import { useTriggerGeneration } from "@/components/hooks/avatar/useTriggerGeneration";
import { PresetSelectorDialog } from "@/components/ui-providers/avatar/PresetSelectorDialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { useToast } from "@/components/shadcn/use-toast";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { type FC } from "react";

export const AvatarSettings: FC = () => {
  const { data: avatar, isLoading } = useAvatar();
  const { data: latestRun } = useLatestRun();
  const enable = useAvatarEnable();
  const disable = useAvatarDisable();
  const generate = useTriggerGeneration();
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await enable.mutateAsync();
      } else {
        await disable.mutateAsync();
      }
    } catch {
      toast({
        description: "Failed to update avatar settings",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync();
      toast({ description: "New avatar generated successfully", title: "Done" });
    } catch (e) {
      toast({
        description: e instanceof Error ? e.message : "Generation failed",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  const isEnabled = avatar?.isEnabled ?? false;
  const onCooldown =
    avatar?.nextGenerationAt != null &&
    avatar.nextGenerationAt > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Dynamic Avatar</p>
          <p className="text-sm text-muted-foreground">
            AI-generated avatar based on your tracked activity
          </p>
        </div>
        <Switch
          checked={isEnabled}
          disabled={enable.isPending || disable.isPending}
          onCheckedChange={handleToggle}
        />
      </div>

      {isEnabled && (
        <>
          <Separator />

          <div className="flex items-start gap-6">
            {avatar?.currentThumbUrl ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <Image
                  alt="Current avatar"
                  className="object-cover"
                  fill
                  src={avatar.currentThumbUrl}
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No image yet
              </div>
            )}

            <div className="space-y-2">
              {latestRun?.completedAt && (
                <p className="text-sm text-muted-foreground">
                  Last generated {format(latestRun.completedAt, "PPP")}
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
                  {generate.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                <PresetSelectorDialog currentPresetId={avatar?.basePresetId ?? null} />
              </div>

              {latestRun?.status === "running" && (
                <Badge variant="secondary">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Generating…
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
