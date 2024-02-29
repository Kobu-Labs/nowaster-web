import { FC } from "react";
import { useActiveSession } from "@/components/hooks/useActiveSessions";
import { ActiveSessionVisualizer } from "@/components/visualizers/ActiveSessionVisualizer";

export const ActiveSessionPresenter: FC = () => {
  const sessions = useActiveSession();

  return (
    <ActiveSessionVisualizer session={sessions.at(0) || null} />
  );
};
