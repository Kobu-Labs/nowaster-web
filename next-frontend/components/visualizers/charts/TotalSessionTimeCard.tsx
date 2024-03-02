import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { differenceInMinutes } from "date-fns";
import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

type TotalSessionTimeCardProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>

}
export const TotalSessionTimeCard: FC<TotalSessionTimeCardProps> = (props) => {

  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      if (data.isErr) {
        return 0;
      }
      return data.value.reduce((acc, curr) => acc + differenceInMinutes(curr.endTime, curr.startTime), 0);
    }
  });

  return (
    <KpiCardUiProvider variant={"big_value"} value={formatTime(result || 0)} title={"Total time"} />
  );
};
