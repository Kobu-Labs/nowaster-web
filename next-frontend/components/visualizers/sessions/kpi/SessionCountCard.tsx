import type { FC } from "react";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { Sigma } from "lucide-react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";

interface SessionCountCardProps {
  filter?: SessionFilterPrecursor;
}

export const SessionCountCard: FC<SessionCountCardProps> = (props) => {
  const {
    data: result,
    isError,
    isLoading,
  } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    select: (data) => data.length,
  });

  return (
    <KpiCardUiProvider
      error={isError}
      loading={isLoading}
      title="Total sessions"
      value={result}
      variant="big_value"
    >
      <Sigma />
    </KpiCardUiProvider>
  );
};
