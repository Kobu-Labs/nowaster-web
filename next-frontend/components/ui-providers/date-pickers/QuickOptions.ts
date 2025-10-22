import {
  addHours,
  addMinutes,
  setMinutes,
  subHours,
  subMinutes,
} from "date-fns";

export type QuickOption = {
  increment: (date: Date) => Date;
  label: string;
};

export const dateQuickOptions: QuickOption[] = [
  {
    increment: () => new Date(),
    label: "now",
  },
  {
    increment: (date) => setMinutes(date, 0),
    label: "clamp",
  },
  {
    increment: (date) => addMinutes(date, 15),
    label: "+ 15m",
  },
  {
    increment: (date) => subMinutes(date, 15),
    label: "- 15m",
  },
  {
    increment: (date) => addHours(date, 1),
    label: "+ 1h",
  },
  {
    increment: (date) => subHours(date, 1),
    label: "- 1h",
  },
];
