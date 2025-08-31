import { MonthDatePicker } from "@/components/ui-providers/date-pickers/MonthDatePicker";
import { WeekDatePicker } from "@/components/ui-providers/date-pickers/WeekDatePicker";
import { YearDatePicker } from "@/components/ui-providers/date-pickers/YearDatePicker";
import type { Granularity } from "@/components/visualizers/sessions/charts/GranularitySelect";
import { type ComponentProps, type FC } from "react";

const granularityToComponent = {
  "days-in-month": MonthDatePicker,
  "days-in-week": WeekDatePicker,
  "months-in-year": YearDatePicker,
} satisfies Record<Granularity, FC<any>>;

interface GranularityBasedDatePickerProps<G extends Granularity> {
  granularity: G;
  props: GranularityToProps[G];
}

type GranularityToProps = {
  [G in keyof typeof granularityToComponent]: ComponentProps<
    (typeof granularityToComponent)[G]
  >;
};

export const GranularityBasedDatePicker = <G extends Granularity>({
  granularity,
  props,
}: GranularityBasedDatePickerProps<G>) => {
  const Component = granularityToComponent[granularity];
  return <Component {...(props as any)} />;
};
