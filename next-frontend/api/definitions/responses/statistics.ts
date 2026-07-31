import { z } from "zod";

const getStreakData = z.array(z.coerce.date<Date>());

const getDashboardData = z.object({
  minutes: z.number(),
  session_count: z.number(),
  streak: z.number(),
});

const getDailyActivity = z.array(
  z.object({
    // Kept as a raw "yyyy-MM-dd" string rather than coerced to a Date: that
    // coercion parses as UTC midnight, and formatting it back out with the
    // browser's local timezone can shift it a day off for anyone west of UTC.
    date: z.string(),
    minutes: z.number(),
    session_count: z.number(),
  }),
);

export type StatisticsResponse = {
  [Property in (keyof typeof StatisticsResponseSchema)]: z.infer<typeof StatisticsResponseSchema[Property]>
};

export const StatisticsResponseSchema = {
  getDailyActivity,
  getDashboardData,
  getStreakData,
} as const;
