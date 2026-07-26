import { addDays, format, getDay, startOfDay } from "date-fns";

export type DailyActivityPoint = {
  date: Date;
  minutes: number;
  sessionCount: number;
};

export type HeatmapCell = {
  date: Date | null;
  minutes: number;
  sessionCount: number;
  tier: number;
};

export type HeatmapColumn = {
  cells: HeatmapCell[];
  // True when this column is the first to show a new month and should get a
  // gap/label before it (always false for the very first column overall).
  isMonthStart: boolean;
  monthLabel: null | string;
};

export type HeatmapRange = {
  end: Date;
  start: Date;
};

export type MonthLabel = {
  label: string;
  weekIndex: number;
};

export const CURRENT_YEAR = new Date().getFullYear();

const dateKey = (date: Date) => format(date, "yyyy-MM-dd");

// Inverse of dateKey. Parses via local year/month/day components instead of
// `new Date(string)`, which treats a bare "yyyy-MM-dd" as UTC midnight - fine
// in UTC, but formatting that instant back out with the browser's local
// timezone silently shifts it a day off for anyone west of UTC.
export const parseLocalDateKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

// A full calendar year, Jan 1 - Dec 31, regardless of how much of it has
// elapsed - the grid always shows all 12 months so its shape doesn't change
// as the year progresses.
export const calendarYearRange = (year: number): HeatmapRange => ({
  end: new Date(year, 11, 31),
  start: new Date(year, 0, 1),
});

// Quantile breakpoints computed from the user's own active days, so someone
// tracking 30min/day and someone tracking 6h/day both use the full color
// range instead of one washing out the other on a fixed scale. Robust to a
// single outlier day, which would otherwise crush a linear min-max scale.
export const computeQuantileBreakpoints = (
  activeMinutes: number[],
): number[] => {
  if (activeMinutes.length === 0) {
    return [];
  }

  const sorted = [...activeMinutes].sort((a, b) => a - b);
  const percentile = (p: number) => {
    const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[index]!;
  };

  return [
    percentile(0.25),
    percentile(0.5),
    percentile(0.75),
    percentile(0.9),
  ];
};

const computeTier = (minutes: number, breakpoints: number[]): number => {
  if (minutes <= 0) {
    return 0;
  }

  return breakpoints.reduce(
    (tier, breakpoint) => (minutes > breakpoint ? tier + 1 : tier),
    1,
  );
};

// Builds a Sunday-start week grid over an arbitrary date range, padded at
// both ends so every column is a full 7-cell week (padding cells carry
// date: null and are rendered as empty space, never as "no activity" days).
export const buildActivityHeatmap = (
  activity: DailyActivityPoint[],
  range: HeatmapRange,
): { monthLabels: MonthLabel[]; weeks: HeatmapCell[][]; } => {
  const endDate = startOfDay(range.end);
  const startDate = startOfDay(range.start);

  const activityByDate = new Map(
    activity.map((point) => [dateKey(point.date), point]),
  );

  const breakpoints = computeQuantileBreakpoints(
    activity
      .filter((point) => point.minutes > 0)
      .map((point) => point.minutes),
  );

  const leadingPadding = getDay(startDate);
  const trailingPadding = 6 - getDay(endDate);

  const cells: HeatmapCell[] = [];

  for (let i = 0; i < leadingPadding; i++) {
    cells.push({ date: null, minutes: 0, sessionCount: 0, tier: -1 });
  }

  for (
    let cursor = startDate;
    cursor <= endDate;
    cursor = addDays(cursor, 1)
  ) {
    const point = activityByDate.get(dateKey(cursor));
    const minutes = point?.minutes ?? 0;
    cells.push({
      date: cursor,
      minutes,
      sessionCount: point?.sessionCount ?? 0,
      tier: computeTier(minutes, breakpoints),
    });
  }

  for (let i = 0; i < trailingPadding; i++) {
    cells.push({ date: null, minutes: 0, sessionCount: 0, tier: -1 });
  }

  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstRealDay = week.find((cell) => cell.date !== null);
    if (!firstRealDay?.date) {
      return;
    }
    const month = firstRealDay.date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: format(firstRealDay.date, "MMM"), weekIndex });
      lastMonth = month;
    }
  });

  return { monthLabels, weeks };
};

const EMPTY_CELL: HeatmapCell = { date: null, minutes: 0, sessionCount: 0, tier: -1 };

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

// A calendar week almost never lines up with a month boundary (Jan 1 lands
// on a Sunday roughly one year in seven), so a week can hold days from two
// different months. To show an accurate gap between months, a week that
// straddles a boundary is split into two partial columns - one per month,
// with the other month's slots left empty - so weekday rows stay aligned
// while the gap lands on the real date, not just the nearest week edge.
export const splitWeeksByMonth = (weeks: HeatmapCell[][]): HeatmapColumn[] => {
  const columns: HeatmapColumn[] = [];
  let lastMonthKey = "";

  const pushColumn = (cells: HeatmapCell[]) => {
    const firstDate = cells.find((cell) => cell.date !== null)?.date ?? null;
    const key = firstDate ? monthKey(firstDate) : null;
    const isNewMonth = key !== null && key !== lastMonthKey;
    if (key !== null) {
      lastMonthKey = key;
    }
    columns.push({
      cells,
      isMonthStart: isNewMonth && columns.length > 0,
      monthLabel: isNewMonth && firstDate ? format(firstDate, "MMM") : null,
    });
  };

  for (const week of weeks) {
    const monthKeysInWeek = new Set(
      week
        .filter((cell): cell is { date: Date; } & HeatmapCell => cell.date !== null)
        .map((cell) => monthKey(cell.date)),
    );

    if (monthKeysInWeek.size <= 1) {
      pushColumn(week);
      continue;
    }

    for (const key of monthKeysInWeek) {
      pushColumn(week.map((cell) => (cell.date && monthKey(cell.date) === key ? cell : EMPTY_CELL)));
    }
  }

  return columns;
};
