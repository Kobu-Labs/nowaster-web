import { FC } from "react";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { Sigma } from "lucide-react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

type SessionCountCardProps = {
  filter?: SessionFilterPrecursor;
};

export const SessionCountCard: FC<SessionCountCardProps> = (props) => {
  const {
    data: result,
    isError,
    isLoading,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value.length;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <KpiCardUiProvider
      error={isError}
      loading={isLoading}
      variant={"big_value"}
      value={result}
      title={"Total sessions"}
    >
      <Sigma />
    </KpiCardUiProvider>
  );
};
