import { ScheduledSession } from "@kobu-labs/nowaster-js-typing";
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

export const Granularity = {
  perDayInWeek: "Per Day In Week",
  perDayInMonth: "Per Day In Month",
  perMonth: "Monthly",
} as const;

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
}> & { granularity: keyof typeof Granularity }

export const dateProcessors: {
  [K in keyof typeof Granularity]: {
    amount: number
    start: (asOf?: Date | undefined) => Date
    end: (asOf?: Date | undefined) => Date
    next: (value: Date) => Date
  }
} = {
  perDayInWeek: {
    start: (asOf) => startOfISOWeek(asOf || Date.now()),
    next: (value) => addDays(value, 1),
    end: (asOf) => endOfISOWeek(asOf || Date.now()),
    amount: 7,
  },
  perDayInMonth: {
    start: (asOf) => startOfMonth(asOf || Date.now()),
    next: (value) => addDays(value, 1),
    end: (asOf) => endOfMonth(asOf || Date.now()),
    amount: getDaysInMonth(Date.now()),
  },
  perMonth: {
    start: (asOf) => startOfYear(asOf || Date.now()),
    next: (value) => addMonths(value, 1),
    end: (asOf) => endOfYear(asOf || Date.now()),
    amount: 12,
  },
} as const;

/**
 * Calculates granularity key from given session
 */
export const granularizers: {
  [K in keyof typeof Granularity]: {
    key: (value: Date) => string
  }
} = {
  perDayInWeek: {
    key: (value: Date) => format(value, "eee"),
  },
  perDayInMonth: {
    key: (value: Date) => value.getDate().toString(),
  },
  perMonth: {
    key: (value: Date) => format(value, "LLL"),
  },
} as const;

/**
 * Specifies all available keys for every type of granularity
 */
export const allKeys: {
  [K in keyof typeof Granularity]: (data: ScheduledSession[]) => string[]
} = {
  perDayInWeek: () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  perDayInMonth: (data) => {
    const days = getDaysInMonth(data.at(0)?.endTime ?? new Date());
    return Array.from({ length: days }, (_, i) => (i + 1).toString());
  },
  perMonth: () => [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec",
  ],
};

const addGroupEntry = (
  result: Record<string, Record<string | number, number>>,
  granularityKey: string,
  sessionKey: string | number,
  item: ScheduledSession
) => {
  if (!result[granularityKey]) {
    result[granularityKey] = {};
  }
  if (!result[granularityKey]![sessionKey]) {
    result[granularityKey]![sessionKey] = 0;
  }

  result[granularityKey]![sessionKey] += differenceInMinutes(
    item.endTime,
    item.startTime
  );
};

/**
 * Groups categories by provided criteria
 * @param  data sessions to be grouped
 * @param  opts grouping criteria - see {@link GroupingOptions}
 */
export const groupSessions = (
  data: ScheduledSession[],
  opts: GroupingOptions
): {
  groupedSessions: CategoryPerGranularity[]
  uniqueCategories: (string | number)[]
} => {
  const accumulator: { [tick: string]: {} } = {};
  if (opts.allKeys) {
    allKeys[opts.granularity](data).forEach((tick) => (accumulator[tick] = {}));
  }

  const sessionKeyGetter =
    opts.sessionKey ?? ((session) => session.category.name);
  const granulizers = granularizers[opts.granularity];
  const uniques: Set<string | number> = new Set();

  const groupedData = data.reduce(
    (
      value: { [granularity: string]: { [category: string]: number } },
      item
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
    accumulator
  );

  return {
    groupedSessions: Object.entries(groupedData).map(([k, v]) => {
      return { granularity: k, ...v };
    }),
    uniqueCategories: Array.from(uniques),
  };
};
