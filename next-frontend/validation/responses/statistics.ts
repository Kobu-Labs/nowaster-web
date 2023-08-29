import { z } from "zod";

export type GetDashboardStatsResponse = z.infer<typeof getDashboardStatsResponseSchema>;

export const getDashboardStatsResponseSchema = z.object({
  streak: z.number(),
  minutes: z.number(),
  session_count: z.number(),
})
