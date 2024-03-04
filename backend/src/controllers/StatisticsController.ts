import { handleOkResp, handleResultErrorResp } from "@/src/controllers/utils/handleResponse";
import statisticsRepo from "@/src/repositories/statistics_repository";
import { Router } from "express";

export const StatisticsController = Router();


StatisticsController.get("/dashboard", async (_req, res) => {
  const dashboardData = await statisticsRepo.getDashboardData();

  if (dashboardData.isErr) {
    return handleResultErrorResp(500, res, dashboardData.error);
  }
  return handleOkResp(dashboardData.value, res);
});

StatisticsController.get("/streak", async (_req, res) => {
  const dashboardData = await statisticsRepo.getStreakCalendarData();

  if (dashboardData.isErr) {
    return handleResultErrorResp(500, res, dashboardData.error);
  }
  return handleOkResp(dashboardData.value, res);
});
