"use client";

import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { UserAvatarThumb } from "@/components/ui-providers/avatar/UserAvatarThumb";
import type { FC } from "react";

export const NavAvatarThumb: FC = () => {
  const user = useCurrentUser();
  return <UserAvatarThumb username={user.username} />;
};
