import { GetDashboardStatsResponse, getDashboardStatsResponseSchema, GetStreakDataResponse, getStreakDataResponseSchema } from "@/validation/responses/statistics";
import { Result } from "@badrap/result";
import baseApi, { handleResponse } from "./baseApi";

export const getDashboardData = async (): Promise<Result<GetDashboardStatsResponse>> => {
  const { data } = await baseApi.get("statistics/dashboard");
  return await handleResponse(data, getDashboardStatsResponseSchema)
};


export const getStreakData = async (): Promise<Result<GetStreakDataResponse>> => {
  const { data } = await baseApi.get("statistics/streak");
  return await handleResponse(data, getStreakDataResponseSchema)
};


