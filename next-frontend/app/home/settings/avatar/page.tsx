"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { AvatarExplainer } from "@/components/ui-providers/avatar/AvatarExplainer";
import { AvatarHero } from "@/components/ui-providers/avatar/AvatarHero";
import { AvatarHistoryGallery } from "@/components/ui-providers/avatar/AvatarHistoryGallery";
import { AvatarHintsSection } from "@/components/ui-providers/avatar/AvatarHintsSection";
import { Separator } from "@/components/shadcn/separator";
import { type FC } from "react";

const AvatarSettingsPage: FC = () => {
  const { data: avatar } = useAvatar();
  const isEnabled = avatar?.isEnabled ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Avatar</h1>
        <p className="text-muted-foreground">
          Manage your AI-generated avatar and how your tracked activity shapes it.
        </p>
      </div>

      <AvatarExplainer />

      <AvatarHero />

      {isEnabled && (
        <>
          <Separator />
          <AvatarHistoryGallery />
          <Separator />
          <AvatarHintsSection />
        </>
      )}
    </div>
  );
};

export default AvatarSettingsPage;
