"use client";

import type { DiscoverySort } from "@/api/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import type { FC } from "react";

type CommunitySortSelectProps = {
  onValueChange: (value: DiscoverySort) => void;
  value: DiscoverySort;
};

const SORT_OPTIONS: { label: string; value: DiscoverySort; }[] = [
  { label: "Most members", value: "members" },
  { label: "Most active", value: "activity" },
  { label: "Newest", value: "newest" },
];

export const CommunitySortSelect: FC<CommunitySortSelectProps> = ({
  onValueChange,
  value,
}) => {
  return (
    <Select
      onValueChange={(next) => onValueChange(next as DiscoverySort)}
      value={value}
    >
      <SelectTrigger className="h-10 w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
