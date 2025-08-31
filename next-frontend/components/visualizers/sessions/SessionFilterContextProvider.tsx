import { ChartFilterContext } from "@/components/context/chart-filter";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { defaultFilter } from "@/state/chart-filter";
import type { FC, PropsWithChildren } from "react";
import { useState } from "react";

export const FilterContextProvider: FC<
  PropsWithChildren<{ initialFilter?: SessionFilterPrecursor; }>
> = ({ children, initialFilter }) => {
  const [filter, setFilter] = useState(initialFilter ?? defaultFilter);

  return (
    <ChartFilterContext value={{ filter, setFilter }}>
      {children}
    </ChartFilterContext>
  );
};
