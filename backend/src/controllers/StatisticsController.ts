import { Router } from "express";
import statisticsRepo from "../repositories/statistics_repository";
import { handleOkResp, handleResultErrorResp } from "./utils/handleResponse";

export const StatisticsController = Router();


StatisticsController.get("/dashboard", async (_req, res) => {
  const dashboardData = await statisticsRepo.getDashboardData()

  if (dashboardData.isErr) {
    return handleResultErrorResp(500, res, dashboardData.error);
  }
  return handleOkResp(dashboardData.value, res);
});

//  TODO: calendar data
