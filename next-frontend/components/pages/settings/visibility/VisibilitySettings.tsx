"use client";

import { User, VisibilityFlags } from "@/api/definitions/models/user";
import { useUpdateVisibility } from "@/components/hooks/user/useUpdateVisibility";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { useToast } from "@/components/shadcn/use-toast";
import { VisibilityUtils } from "@/lib/visibilityUtils";
import { Eye, EyeOff, Globe, Shield, UserCheck, Users } from "lucide-react";
import { FC, useState } from "react";

export const VisibilitySettings: FC<{ user: User }> = ({ user }) => {
  const updateVisibility = useUpdateVisibility();
  const { toast } = useToast();

  const [currentFlags, setCurrentFlags] = useState<VisibilityFlags>(
    VisibilityUtils.fromRaw(
      user.visibilityFlags ?? VisibilityUtils.public().rawValue,
    ),
  );

  const [selectedPreset, setSelectedPreset] = useState<string>("public");

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);

    let newFlags: VisibilityFlags;
    switch (preset) {
      case "private":
        newFlags = VisibilityUtils.none();
        break;
      case "public":
        newFlags = VisibilityUtils.public();
        break;
      default:
        newFlags = currentFlags;
    }

    if (preset !== "custom") {
      setCurrentFlags(newFlags);
    }
  };

  const handleIndividualFlagChange = (
    flagType: "friends" | "groups",
    checked: boolean,
  ) => {
    const newFlags = VisibilityUtils.fromFlags(
      flagType === "friends" ? checked : currentFlags.friends,
      flagType === "groups" ? checked : currentFlags.groups,
    );

    setCurrentFlags(newFlags);

    if (newFlags.isPrivate) {
      setSelectedPreset("private");
    } else if (newFlags.isPublic) {
      setSelectedPreset("public");
    } else {
      setSelectedPreset("custom");
    }
  };

  const handleSave = () => {
    const backendRequest = VisibilityUtils.toBackendRequest(currentFlags);
    updateVisibility.mutate(backendRequest, {
      onSuccess: () => {
        toast({ title: "Visibility settings updated!" });
      },
      onError: () => {
        toast({
          title: "Failed to update visibility settings",
          variant: "destructive",
        });
      },
    });
  };

  const hasChanges = user?.visibilityFlags !== currentFlags.rawValue;

  const labels = VisibilityUtils.getLabels();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {currentFlags.isPrivate ? (
                <>
                  <EyeOff className="h-3 w-3" /> Private
                </>
              ) : currentFlags.isPublic ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" /> Custom
                </>
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {VisibilityUtils.getDescription(currentFlags)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              Quick Settings
            </Label>
            <RadioGroup
              value={selectedPreset}
              onValueChange={handlePresetChange}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-pink-muted hover:text-accent-foreground transition-colors">
                <RadioGroupItem value="private" id="preset-private" />
                <Label
                  htmlFor="preset-private"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <EyeOff className="h-4 w-4" />
                    {labels.private.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {labels.private.description}
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-pink-muted hover:text-accent-foreground transition-colors">
                <RadioGroupItem value="custom" id="preset-custom" />
                <Label
                  htmlFor="preset-custom"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4" />
                    Custom
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Choose specific permissions
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-pink-muted hover:text-accent-foreground transition-colors">
                <RadioGroupItem value="public" id="preset-public" />
                <Label
                  htmlFor="preset-public"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4" />
                    {labels.public.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {labels.public.description}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">
              Detailed Permissions
            </Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Friends</div>
                    <div className="text-sm text-muted-foreground">
                      Your friends can see your activity
                    </div>
                  </div>
                </div>
                <Checkbox
                  checked={currentFlags.friends}
                  onCheckedChange={(checked) =>
                    handleIndividualFlagChange("friends", checked === true)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Groups</div>
                    <div className="text-sm text-muted-foreground">
                      Group members can see your activity
                    </div>
                  </div>
                </div>
                <Checkbox
                  checked={currentFlags.groups}
                  onCheckedChange={(checked) =>
                    handleIndividualFlagChange("groups", checked === true)
                  }
                />
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={updateVisibility.isPending}
              >
                {updateVisibility.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="font-medium">Current Settings:</div>
            <div className="text-muted-foreground">
              {VisibilityUtils.getDescription(currentFlags)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {currentFlags.friends && " | Friends"}
              {currentFlags.groups && " | Groups"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
