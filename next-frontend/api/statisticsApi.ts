import { GetDashboardStatsResponse, getDashboardStatsResponseSchema } from "@/validation/responses/statistics";
import { Result } from "@badrap/result";
import baseApi, { handleResponse } from "./baseApi";

export const getData = async (): Promise<Result<GetDashboardStatsResponse>> => {
  const { data } = await baseApi.get("statistics/dashboard");
  return await handleResponse(data, getDashboardStatsResponseSchema)
};

