import { getDashboardData } from "@/src/repositories/statistics_repository/dashboard";
import { getStreakCalendarData } from "@/src/repositories/statistics_repository/streak_calendar";

const statisticsRepo = {
  getDashboardData,
  getStreakCalendarData,
};

export default statisticsRepo;
