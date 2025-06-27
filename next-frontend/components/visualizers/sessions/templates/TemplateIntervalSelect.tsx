import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/shadcn/select";
import React from "react";

const IntervalToLabel: Record<RecurringSessionInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
} as const;

export const TemplateIntervalSelect = React.forwardRef<
  React.ElementRef<typeof Select>,
  React.ComponentPropsWithoutRef<typeof Select>
>(({ ...props }) => {
  return (
    <Select {...props}>
      <SelectTrigger>
        <SelectValue
          placeholder="Select an interval!"
          className="text-muted-foreground"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultChecked>
          {Object.entries(IntervalToLabel).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});
