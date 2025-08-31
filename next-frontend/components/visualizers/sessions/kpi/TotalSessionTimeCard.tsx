import type { FC } from "react";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import type {
  KpiCardUiProviderProps } from "@/components/ui-providers/KpiCardUiProvider";
import {
  KpiCardUiProvider,
} from "@/components/ui-providers/KpiCardUiProvider";
import { Clock1 } from "lucide-react";

type TotalSessionTimeCardProps = {
  filter?: SessionFilterPrecursor;
} & Partial<
  Pick<
    KpiCardUiProviderProps<number>,
    "description" | "mapper" | "title" | "variant"
  >
>;

export const TotalSessionTimeCard: FC<TotalSessionTimeCardProps> = (props) => {
  const {
    data: result,
    isError,
    isLoading,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      return data.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0,
      );
    },
  });

  return (
    <KpiCardUiProvider
      description={props.description}
      error={isError}
      loading={isLoading}
      mapper={props.mapper ?? formatTime}
      title={props.title ?? "Total time"}
      value={result}
      variant={props.variant ?? "big_value"}
    >
      <Clock1 />
    </KpiCardUiProvider>
  );
};
