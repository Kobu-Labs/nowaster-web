import { z } from "zod";

export type GetDashboardStatsResponse = z.infer<typeof getDashboardStatsResponseSchema>;
export type GetStreakDataResponse = z.infer<typeof getStreakDataResponseSchema>;

export const getStreakDataResponseSchema = z.array(z.coerce.date())

export const getDashboardStatsResponseSchema = z.object({
  streak: z.number(),
  minutes: z.number(),
  session_count: z.number(),
})
