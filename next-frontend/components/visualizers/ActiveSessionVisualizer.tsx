"use client";
import { getFormattedTimeDifference } from "@/lib/utils";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";
import { SessionTag } from "@/stories/SessionTag/SessionTag";
import { ScheduledSession } from "@kobu-labs/nowaster-js-typing";
import { FC, useState } from "react";

type ActiveSessionVisualizerProps = {
  session: ScheduledSession | null
}

export const ActiveSessionVisualizer: FC<ActiveSessionVisualizerProps> = ({ session }) => {
  const [displayedTime, setDisplayedTime] = useState(getFormattedTimeDifference(session !== null ? session.endTime : new Date(), new Date()));

  if (session === null) {
    return <></>;
  }

  setTimeout(() => {
    const result = displayedTime.includes(":") ? displayedTime.replace(":", " ") : getFormattedTimeDifference(session.endTime, new Date());
    setDisplayedTime(result);
  }, 500);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CategoryLabel label={session.category} />
          <div className="font-medium">{displayedTime}</div>
        </div>
        <div className="flex gap-1" >
          {session.tags.map((val) => <SessionTag key={val.id} value={val.label} />)}
        </div>
      </div>
    </div >
  );
};
