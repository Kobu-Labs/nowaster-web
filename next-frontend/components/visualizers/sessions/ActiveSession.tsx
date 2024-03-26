import { FC } from "react";

import { useActiveSession } from "@/components/hooks/useActiveSessions";
import { ActiveSessionUiProvider } from "@/components/ui-providers/ActiveSessionUiProvider";

export const ActiveSession: FC = () => {
  const sessions = useActiveSession();

  return <ActiveSessionUiProvider session={sessions.at(0) || null} />;
};
