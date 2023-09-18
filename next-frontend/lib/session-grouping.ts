import { ScheduledSession } from "@/validation/models";
import { addDays, addMonths, differenceInMinutes, endOfISOWeek, endOfMonth, endOfYear, getDate, getDay, getDaysInMonth, getMonth, startOfISOWeek, startOfMonth, startOfYear } from "date-fns";
export const Granularity = {
  week: "Past week",
  month: "Past month",
  year: "Past year"
} as const;

export type SessionsByCategory = { [category: string]: string } & { granularity: string }

export const dateProcessors: {
  [K in keyof typeof Granularity]: {
    amount: number,
    start: (asOf?: Date | undefined) => Date,
    end: (asOf?: Date | undefined) => Date,
    next: (value: Date) => Date,
  }
} = {
  week: {
    start: (asOf) => startOfISOWeek(asOf || Date.now()),
    next: value => addDays(value, 1),
    end: (asOf) => endOfISOWeek(asOf || Date.now()),
    amount: 7,
  },
  month: {
    start: (asOf) => startOfMonth(asOf || Date.now()),
    next: value => addDays(value, 1),
    end: (asOf) => endOfMonth(asOf || Date.now()),
    amount: getDaysInMonth(Date.now()),
  },
  year: {
    start: (asOf) => startOfYear(asOf || Date.now()),
    next: value => addMonths(value, 1),
    end: (asOf) => endOfYear(asOf || Date.now()),
    amount: 12,
  }
} as const;


export const granularizers: {
  [K in keyof typeof Granularity]: {
    key: (value: Date) => string,
  }
} = {
  week: {
    key: (value: Date) => (getDay(value) === 0 ? 7 : getDay(value)).toString()
  },
  month: {
    key: (value: Date) => getDate(value).toString()
  },
  year: {
    key: (value: Date) => (getMonth(value) + 1).toString()
  }
} as const;

export const groupSessionsByKey = (processor: typeof granularizers[keyof typeof granularizers], data: (ScheduledSession)[]): SessionsByCategory[] => {
  let processed = data.reduce((value: { [granularity: string]: { [category: string]: number } }, item) => {
    const key = processor.key(item.endTime);
    if (!value[key]) {
      value[key] = {};
    }
    if (!value[key]![item.category]) {
      value[key]![item.category] = 0;
    }

    value[key]![item.category] += differenceInMinutes(item.endTime, item.startTime);
    return value;
  }, {});


  return Object.entries(processed).map(([k, v]) => {
    return { granularity: k, ...v };
  });
};
