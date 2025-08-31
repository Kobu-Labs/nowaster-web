import type { ScheduledSession } from "@/api/definitions";
import type { Granularity } from "@/components/visualizers/sessions/charts/GranularitySelect";
import {
  addDays,
  addMonths,
  differenceInMinutes,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  format,
  getDaysInMonth,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";

export type CategoryPerGranularity = {
  granularity: string;
} & Record<string, string>;

/**
 * @type allKeys whether all not to display all keys per given granularity
 * @type sessionKey function for computing the key from given session
 * @type granularity
 */
export type GroupingOptions = { granularity: Granularity; } & Partial<{
  allKeys: boolean;
  sessionKey: (
    session: ScheduledSession,
  ) => number | number[] | string | string[];
}>;

export const dateProcessors: Record<
  Granularity,
  {
    amount: number;
    end: (asOf?: Date) => Date;
    next: (value: Date) => Date;
    start: (asOf?: Date) => Date;
  }
> = {
  "days-in-month": {
    amount: getDaysInMonth(Date.now()),
    end: (asOf) => endOfMonth(asOf ?? Date.now()),
    next: (value) => addDays(value, 1),
    start: (asOf) => startOfMonth(asOf ?? Date.now()),
  },
  "days-in-week": {
    amount: 7,
    end: (asOf) => endOfISOWeek(asOf ?? Date.now()),
    next: (value) => addDays(value, 1),
    start: (asOf) => startOfISOWeek(asOf ?? Date.now()),
  },
  "months-in-year": {
    amount: 12,
    end: (asOf) => endOfYear(asOf ?? Date.now()),
    next: (value) => addMonths(value, 1),
    start: (asOf) => startOfYear(asOf ?? Date.now()),
  },
} as const;

/**
 * Calculates granularity key from given session
 */
export const granularizers: Record<
  Granularity,
  {
    key: (value: Date) => string;
  }
> = {
  "days-in-month": {
    key: (value: Date) => value.getDate().toString(),
  },
  "days-in-week": {
    key: (value: Date) => format(value, "eee"),
  },
  "months-in-year": {
    key: (value: Date) => format(value, "LLL"),
  },
} as const;

/**
 * Specifies all available keys for every type of granularity
 */
export const allKeys: Record<
  Granularity,
  (data: ScheduledSession[]) => string[]
> = {
  "days-in-month": (data) => {
    const days = getDaysInMonth(data.at(0)?.endTime ?? new Date());
    return Array.from({ length: days }, (_, i) => (i + 1).toString());
  },
  "days-in-week": () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "months-in-year": () => [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};

const addGroupEntry = (
  result: Record<string, Record<number | string, number>>,
  granularityKey: string,
  sessionKey: number | string,
  item: ScheduledSession,
) => {
  result[granularityKey] ??= {};
  result[granularityKey][sessionKey] ??= 0;

  result[granularityKey][sessionKey] += differenceInMinutes(
    item.endTime,
    item.startTime,
  );
};

/**
 * Groups categories by provided criteria
 * @param  data sessions to be grouped
 * @param  opts grouping criteria - see {@link GroupingOptions}
 */
export const groupSessions = (
  data: ScheduledSession[],
  opts: GroupingOptions,
): {
  groupedSessions: CategoryPerGranularity[];
  uniqueCategories: (number | string)[];
} => {
  const accumulator: Record<string, Record<string, number>> = {};
  if (opts.allKeys) {
    allKeys[opts.granularity](data).forEach((tick) => (accumulator[tick] = {}));
  }

  const sessionKeyGetter
    = opts.sessionKey ?? ((session) => session.category.name);
  const granulizers = granularizers[opts.granularity];
  const uniques = new Set<number | string>();

  const groupedData = data.reduce(
    (value: Record<string, Record<string, number>>, item) => {
      const granularityKey = granulizers.key(item.endTime);
      const sessionKey = sessionKeyGetter(item);
      if (Array.isArray(sessionKey)) {
        sessionKey.forEach((key) => {
          addGroupEntry(value, granularityKey, key, item);
          uniques.add(key);
        });
      } else {
        addGroupEntry(value, granularityKey, sessionKey, item);
        uniques.add(sessionKey);
      }
      return value;
    },
    accumulator,
  );

  return {
    groupedSessions: Object.entries(groupedData).map(([k, v]) => {
      return { granularity: k, ...v };
    }),
    uniqueCategories: [...uniques],
  };
};
