import { FC } from "react";

import { useActiveSessions } from "@/components/hooks/useActiveSessions";
import { ActiveSessionUiProvider } from "@/components/ui-providers/ActiveSessionUiProvider";

export const ActiveSession: FC = () => {
  const sessions = useActiveSessions();

  if (!sessions.isSuccess) {
    return null;
  }

  return <ActiveSessionUiProvider session={sessions.data.at(0) ?? null} />;
};
