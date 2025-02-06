import { z } from "zod";

const getStreakData = z.array(z.coerce.date());

const getDashboardData = z.object({
  streak: z.number(),
  minutes: z.number(),
  session_count: z.number(),
});

export type StatisticsResponse = {
    [Property in (keyof typeof StatisticsResponseSchema)]: z.infer<typeof StatisticsResponseSchema[Property]>
}

export const StatisticsResponseSchema = {
  getStreakData,
  getDashboardData,
} as const;
