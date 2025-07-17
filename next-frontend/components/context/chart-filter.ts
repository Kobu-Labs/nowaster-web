import { SessionFilterPrecursor } from "@/state/chart-filter";
import { createContext, Dispatch, SetStateAction } from "react";

type ChartFilterContextType = {
  filter: SessionFilterPrecursor;
  setFilter: Dispatch<SetStateAction<SessionFilterPrecursor>>;
};

export const ChartFilterContext = createContext<
  ChartFilterContextType | undefined
>(undefined);
