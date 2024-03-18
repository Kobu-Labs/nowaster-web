import { FC } from "react"
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing"
import { useQuery } from "@tanstack/react-query"
import { Sigma } from "lucide-react"

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys"
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider"

type SessionCountCardProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const SessionCountCard: FC<SessionCountCardProps> = (props) => {
  const { data: result } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    retry: false,
    select: (data) => (data.isOk ? data.value.length : 0),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return (
    <KpiCardUiProvider
      variant={"big_value"}
      value={result || 0}
      title={"Total sessions"}
    >
      <Sigma />
    </KpiCardUiProvider>
  )
}
