import { MonthDatePicker } from "@/components/ui-providers/date-pickers/MonthDatePicker";
import { WeekDatePicker } from "@/components/ui-providers/date-pickers/WeekDatePicker";
import { YearDatePicker } from "@/components/ui-providers/date-pickers/YearDatePicker";
import { Granularity } from "@/components/visualizers/sessions/charts/GranularitySelect";
import { type ComponentProps, type FC } from "react";

const granularityToComponent = {
  "days-in-week": WeekDatePicker,
  "days-in-month": MonthDatePicker,
  "months-in-year": YearDatePicker,
} satisfies { [Key in Granularity]: FC<any> };

type GranularityToProps = {
  [G in keyof typeof granularityToComponent]: ComponentProps<
    (typeof granularityToComponent)[G]
  >;
};

type GranularityBasedDatePickerProps<G extends Granularity> = {
  granularity: G;
  props: GranularityToProps[G];
};

export const GranularityBasedDatePicker = <G extends Granularity>({
  granularity,
  props,
}: GranularityBasedDatePickerProps<G>) => {
  const Component = granularityToComponent[granularity];
  return <Component {...(props as any)} />;
};
