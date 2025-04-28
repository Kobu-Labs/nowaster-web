import { ScheduledSessionWithId } from "@/api/definitions";
import { areIntervalsOverlapping } from "date-fns";

export const hasIntersection = (
  session1: ScheduledSessionWithId,
  session2: ScheduledSessionWithId,
): boolean => {
  return areIntervalsOverlapping(
    {
      start: session1.startTime,
      end: session1.endTime,
    },
    {
      start: session2.startTime,
      end: session2.endTime,
    },
    { inclusive: true },
  );
};

export const sessionToNonIntersection = (
  sessions: ScheduledSessionWithId[],
): ScheduledSessionWithId[][] => {
  const groupedSessions: ScheduledSessionWithId[][] = [];

  sessions.forEach((session) => {
    let nextGroup;
    for (const group of groupedSessions) {
      const hasOverlap = group.some((s) => hasIntersection(s, session));
      if (!hasOverlap) {
        nextGroup = group;
        break;
      }
    }

    if (nextGroup) {
      nextGroup.push(session);
    } else {
      groupedSessions.push([session]);
    }
  });

  return groupedSessions;
};
