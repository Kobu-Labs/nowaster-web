import { Result } from "@badrap/result";
import client from "../client";
import type { AsyncResult } from "../types";
import { addDays, differenceInMinutes, isSameDay, subDays } from "date-fns";

const getCurrentStreak = async (): AsyncResult<number> => {
  try {
    const take = 45;
    let currentSkip = 0;
    let currentDate = new Date();
    let streak = 0;
    let sessions;

    do {
      sessions = await client.scheduledEntity.findMany({
        select: {
          endTime: true,
        },
        where: {
          endTime: {
            lte: new Date(),
          }
        },
        skip: currentSkip,
        take: take,
        orderBy: {
          endTime: "desc",
        },
      });
            console.log("fetched:" + sessions)

      for (const { endTime } of sessions) {
        if (isSameDay(endTime, currentDate)) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else if (isSameDay(endTime, addDays(currentDate, 1))) {
          // noop - multiple sessions in one day
        } else {
          return Result.ok(streak);
        }
      }

      currentSkip++;
    } while (sessions.length > 0);

    return Result.ok(streak);
  } catch (error) {
    return Result.err(error as Error);
  }
};
