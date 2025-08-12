import { FC } from "react";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  KpiCardUiProvider,
  KpiCardUiProviderProps,
} from "@/components/ui-providers/KpiCardUiProvider";
import { Clock1 } from "lucide-react";

type TotalSessionTimeCardProps = {
  filter?: SessionFilterPrecursor;
} & Partial<
  Pick<
    KpiCardUiProviderProps<number>,
    "title" | "description" | "variant" | "mapper"
  >
>;

export const TotalSessionTimeCard: FC<TotalSessionTimeCardProps> = (props) => {
  const {
    data: result,
    isLoading,
    isError,
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
      variant={props.variant ?? "big_value"}
      mapper={props.mapper ?? formatTime}
      value={result}
      title={props.title ?? "Total time"}
    >
      <Clock1 />
    </KpiCardUiProvider>
  );
};
