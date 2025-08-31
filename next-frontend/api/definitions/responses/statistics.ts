import { z } from "zod";

const getStreakData = z.array(z.coerce.date<Date>());

const getDashboardData = z.object({
  minutes: z.number(),
  session_count: z.number(),
  streak: z.number(),
});

export type StatisticsResponse = {
  [Property in (keyof typeof StatisticsResponseSchema)]: z.infer<typeof StatisticsResponseSchema[Property]>
};

export const StatisticsResponseSchema = {
  getDashboardData,
  getStreakData,
} as const;
