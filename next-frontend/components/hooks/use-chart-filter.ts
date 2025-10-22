import { ChartFilterContext } from "@/components/context/chart-filter";
import { use } from "react";

export const useChartFilter = () => {
  const context = use(ChartFilterContext);
  if (!context) {
    throw new Error("useChartFilter must be used within a ChartFilterProvider");
  }
  return context;
};
