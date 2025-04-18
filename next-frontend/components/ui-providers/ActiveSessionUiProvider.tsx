"use client";

import { FC, useState } from "react";
import { ScheduledSession } from "@/api/definitions";

import { getFormattedTimeDifference } from "@/lib/utils";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";

type ActiveSessionUiProviderProps = {
  session: ScheduledSession | null;
};

export const ActiveSessionUiProvider: FC<ActiveSessionUiProviderProps> = ({
  session,
}) => {
  const [displayedTime, setDisplayedTime] = useState(
    getFormattedTimeDifference(
      session !== null ? session.endTime : new Date(),
      new Date(),
    ),
  );

  if (session === null) {
    return <></>;
  }

  setTimeout(() => {
    const result = displayedTime.includes(":")
      ? displayedTime.replace(":", " ")
      : getFormattedTimeDifference(session.endTime, new Date());
    setDisplayedTime(result);
  }, 500);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CategoryLabel category={session.category} />
          <div className="font-medium">{displayedTime}</div>
        </div>
        <div className="flex gap-1">
          {session.tags.map((tag) => (
            <TagBadge tag={tag} variant="auto" key={tag.id} />
          ))}
        </div>
      </div>
    </div>
  );
};
