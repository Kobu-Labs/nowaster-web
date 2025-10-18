import type { SessionFilterPrecursor } from "@/state/chart-filter";
import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

type ChartFilterContextType = {
  filter: SessionFilterPrecursor;
  setFilter: Dispatch<SetStateAction<SessionFilterPrecursor>>;
};

export const ChartFilterContext = createContext<
  ChartFilterContextType | undefined
>(undefined);
