import type { HeatmapCell } from "@/lib/activity-heatmap";
import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

export type ActivityHeatmapContextType = {
  displayYear: number;
  isError: boolean;
  isPending: boolean;
  selectedYear: number;
  setSelectedYear: Dispatch<SetStateAction<number>>;
  totalMinutes: number;
  weeks: HeatmapCell[][];
};

export const ActivityHeatmapContext = createContext<
  ActivityHeatmapContextType | undefined
>(undefined);
