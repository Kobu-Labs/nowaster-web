import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { SelectProps } from "@radix-ui/react-select";
import { FC } from "react";

const IntervalToLabel: Record<RecurringSessionInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
} as const;

export const TemplateIntervalSelect: FC<SelectProps> = ({ ...props }) => {
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
};
