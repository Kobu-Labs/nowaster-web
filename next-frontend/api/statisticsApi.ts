import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import {
  StatisticsResponse,
  StatisticsResponseSchema,
} from "@/api/definitions";

export const getDashboardData = async (): Promise<
  Result<StatisticsResponse["getDashboardData"]>
> => {
  const { data } = await baseApi.get("statistics/dashboard");
  return await handleResponse(data, StatisticsResponseSchema.getDashboardData);
};

export const getStreakData = async (): Promise<
  Result<StatisticsResponse["getStreakData"]>
> => {
  const { data } = await baseApi.get("statistics/streak");
  return await handleResponse(data, StatisticsResponseSchema.getStreakData);
};
