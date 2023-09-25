import { FC } from "react";
import { useActiveSession } from "../hooks/useActiveSessions";
import { ActiveSessionVisualizer } from "../visualizers/ActiveSessionVisualizer";

export const ActiveSessionPresenter: FC = () => {
  const sessions = useActiveSession();

  return (
    <ActiveSessionVisualizer session={sessions.at(0) || null} />
  );
};
