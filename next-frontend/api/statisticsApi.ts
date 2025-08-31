import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import {
  StatisticsResponseSchema,
} from "@/api/definitions";
import { z } from "zod";

export const getDashboardData = async () => {
  const { data } = await baseApi.get("statistics/dashboard");
  return await parseResponseUnsafe(data, StatisticsResponseSchema.getDashboardData);
};

export const getStreakData = async () => {
  const { data } = await baseApi.get("statistics/streak");
  return await parseResponseUnsafe(data, StatisticsResponseSchema.getStreakData);
};

export const getColors = async () => {
  const { data } = await baseApi.get("statistics/colors");
  return await parseResponseUnsafe(
    data,
    z.object({
      category_colors: z.array(z.tuple([z.string(), z.string()])),
      tag_colors: z.array(z.tuple([z.string(), z.string()])),
    }),
  );
};
