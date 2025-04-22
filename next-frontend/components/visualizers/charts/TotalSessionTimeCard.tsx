import { FC } from "react";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { Clock1 } from "lucide-react";

type TotalSessionTimeCardProps = {
  filter?: SessionFilterPrecursor;
};

export const TotalSessionTimeCard: FC<TotalSessionTimeCardProps> = (props) => {
  const {
    data: result,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value.reduce(
        (acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime),
        0,
      );
    },
  });

  return (
    <KpiCardUiProvider
      error={isError}
      loading={isLoading}
      variant={"big_value"}
      mapper={formatTime}
      value={result}
      title={"Total time"}
    >
      <Clock1 />
    </KpiCardUiProvider>
  );
};
