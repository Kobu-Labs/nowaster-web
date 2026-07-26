import { ActivityHeatmapContext } from "@/components/context/activity-heatmap";
import { use } from "react";

export const useActivityHeatmap = () => {
  const context = use(ActivityHeatmapContext);
  if (!context) {
    throw new Error(
      "useActivityHeatmap must be used within an ActivityHeatmapProvider",
    );
  }
  return context;
};
