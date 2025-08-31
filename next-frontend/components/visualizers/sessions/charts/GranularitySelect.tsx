import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";
import { type FC, useState } from "react";

export type Granularity = "days-in-month" | "days-in-week" | "months-in-year";

interface GranularitySelectProps {
  defaultValue?: Granularity;
  onSelect: (val: Granularity) => void;
}

export const GranularityToLabel: Record<Granularity, string> = {
  "days-in-month": "Month",
  "days-in-week": "Week",
  "months-in-year": "Year",
} as const;

export const GranularitySelect: FC<GranularitySelectProps> = (props) => {
  const [granularity, setGranularity] = useState<Granularity>(
    props.defaultValue ?? "days-in-week",
  );

  return (
    <Select
      onValueChange={(a: Granularity) => {
        setGranularity(a);
        props.onSelect(a);
      }}
      value={granularity}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={GranularityToLabel[granularity]} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultChecked>
          {Object.entries(GranularityToLabel).map(([k, v]) => (
            <SelectItem disabled={k === granularity} key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};


