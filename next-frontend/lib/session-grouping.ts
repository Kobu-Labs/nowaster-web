import { Granularity } from "@/components/visualizers/charts/GranularitySelect";
import { ScheduledSession } from "@/api/definitions";
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

export type CategoryPerGranularity = { [category: string]: string } & {
    granularity: string
}

/**
 * @type allKeys whether all not to display all keys per given granularity
 * @type sessionKey function for computing the key from given session
 * @type granularity
 */
export type GroupingOptions = Partial<{
    allKeys: boolean
    sessionKey: (
        session: ScheduledSession
    ) => string | number | string[] | number[]
}> & { granularity: Granularity }

export const dateProcessors: {
    [K in Granularity]: {
        amount: number
        start: (asOf?: Date | undefined) => Date
        end: (asOf?: Date | undefined) => Date
        next: (value: Date) => Date
    }
} = {
  "days-in-week": {
    start: (asOf) => startOfISOWeek(asOf ?? Date.now()),
    next: (value) => addDays(value, 1),
    end: (asOf) => endOfISOWeek(asOf ?? Date.now()),
    amount: 7,
  },
  "days-in-month": {
    start: (asOf) => startOfMonth(asOf ?? Date.now()),
    next: (value) => addDays(value, 1),
    end: (asOf) => endOfMonth(asOf ?? Date.now()),
    amount: getDaysInMonth(Date.now()),
  },
  "months-in-year": {
    start: (asOf) => startOfYear(asOf ?? Date.now()),
    next: (value) => addMonths(value, 1),
    end: (asOf) => endOfYear(asOf ?? Date.now()),
    amount: 12,
  },
} as const;

/**
 * Calculates granularity key from given session
 */
export const granularizers: {
    [K in Granularity]: {
        key: (value: Date) => string
    }
} = {
  "days-in-week": {
    key: (value: Date) => format(value, "eee"),
  },
  "days-in-month": {
    key: (value: Date) => value.getDate().toString(),
  },
  "months-in-year": {
    key: (value: Date) => format(value, "LLL"),
  },
} as const;

/**
 * Specifies all available keys for every type of granularity
 */
export const allKeys: {
    [K in Granularity]: (data: ScheduledSession[]) => string[]
} = {
  "days-in-week": () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "days-in-month": (data) => {
    const days = getDaysInMonth(data.at(0)?.endTime ?? new Date());
    return Array.from({ length: days }, (_, i) => (i + 1).toString());
  },
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
  result: Record<string, Record<string | number, number>>,
  granularityKey: string,
  sessionKey: string | number,
  item: ScheduledSession,
) => {
  if (!result[granularityKey]) {
    result[granularityKey] = {};
  }
  if (!result[granularityKey][sessionKey]) {
    result[granularityKey][sessionKey] = 0;
  }

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
    groupedSessions: CategoryPerGranularity[]
    uniqueCategories: (string | number)[]
} => {
  const accumulator: { [tick: string]: Record<string, number> } = {};
  if (opts.allKeys) {
    allKeys[opts.granularity](data).forEach((tick) => (accumulator[tick] = {}));
  }

  const sessionKeyGetter =
        opts.sessionKey ?? ((session) => session.category.name);
  const granulizers = granularizers[opts.granularity];
  const uniques = new Set<string | number>();

  const groupedData = data.reduce(
    (
      value: { [granularity: string]: { [category: string]: number } },
      item,
    ) => {
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
    uniqueCategories: Array.from(uniques),
  };
};
