"use client";

import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/shadcn/button";
import type { FC } from "react";

export const WelcomeBackButton: FC = () => {
  const { user, isLoaded } = useAuth();

  if (!isLoaded || !user) return null;

  return (
    <Button variant="outline" className="whitespace-pre">
      <span>Welcome back, </span>
      <span className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
        {user.username}
      </span>
      <span className="text-gray-500">!</span>
    </Button>
  );
};
