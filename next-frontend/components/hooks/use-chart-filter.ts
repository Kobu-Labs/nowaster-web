import { ChartFilterContext } from "@/components/context/chart-filter";
import { useContext } from "react";

export const useChartFilter = () => {
  const context = useContext(ChartFilterContext);
  if (!context) {
    throw new Error("useChartFilter must be used within a ChartFilterProvider");
  }
  return context;
};
