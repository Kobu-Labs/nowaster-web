import { ChartFilterContext } from "@/components/context/chart-filter";
import { SessionFilterPrecursor, defaultFilter } from "@/state/chart-filter";
import { FC, PropsWithChildren, useState } from "react";

export const FilterContextProvider: FC<
  PropsWithChildren<{ initialFilter?: SessionFilterPrecursor }>
> = ({ children, initialFilter }) => {
  const [filter, setFilter] = useState(initialFilter ?? defaultFilter);

  return (
    <ChartFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </ChartFilterContext.Provider>
  );
};
