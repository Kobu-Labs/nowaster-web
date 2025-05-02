import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";
import { type FC, useState } from "react";

export type Granularity = "days-in-week" | "days-in-month" | "months-in-year";

type GranularitySelectProps = {
  onSelect: (val: Granularity) => void;
  defaultValue?: Granularity;
};

export const GranularityToLabel: { [K in Granularity]: string } = {
  "days-in-week": "Week",
  "days-in-month": "Month",
  "months-in-year": "Year",
} as const;

export const GranularitySelect: FC<GranularitySelectProps> = (props) => {
  const [granularity, setGranularity] = useState<Granularity>(
    props.defaultValue ?? "days-in-week",
  );

  return (
    <Select
      value={granularity}
      onValueChange={(a: Granularity) => {
        setGranularity(a);
        props.onSelect(a);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={GranularityToLabel[granularity]} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultChecked>
          {Object.entries(GranularityToLabel).map(([k, v]) => (
            <SelectItem key={k} disabled={k === granularity} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};


