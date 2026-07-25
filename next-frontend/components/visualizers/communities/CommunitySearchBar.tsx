"use client";

import { Input } from "@/components/shadcn/input";
import { Search } from "lucide-react";
import type { FC } from "react";

type CommunitySearchBarProps = {
  onValueChange: (value: string) => void;
  value: string;
};

export const CommunitySearchBar: FC<CommunitySearchBarProps> = ({
  onValueChange,
  value,
}) => {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Search communities"
        value={value}
      />
    </div>
  );
};
