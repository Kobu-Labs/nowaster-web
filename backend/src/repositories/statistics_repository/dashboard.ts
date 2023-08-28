import { Result } from "@badrap/result";
import client from "../client";
import type { AsyncResult } from "../types";
import { addDays, differenceInMinutes, isSameDay, subDays } from "date-fns";

const SESSION_PAGINATION = 45;

type DashboardStatistics = {
    streak: number,
    minutes: number,
    session_count: number
}

export const getDashboardData = async (): AsyncResult<DashboardStatistics> => {
  try {
    const session_count = await getAmountOfSessions();
    if (session_count.isErr) {
      return Result.err(session_count.error);
    }

    const minutes = await sumSessionTimeInMinutes();
    if (minutes.isErr) {
      return Result.err(minutes.error);
    }

    const streak = await getCurrentStreak();
    if (streak.isErr) {
      return Result.err(streak.error);
    }

    return Result.ok({
      streak: streak.value,
      minutes: minutes.value,
      session_count: session_count.value
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

const getAmountOfSessions = async (): AsyncResult<number> => {
  try {
    return Result.ok(await client.scheduledEntity.count());
  }
  catch (error) {
    return Result.err(error as Error);
  }
};

const sumSessionTimeInMinutes = async (): AsyncResult<number> => {
  try {
    const session = await client.scheduledEntity.findMany({
      select: {
        endTime: true,
        startTime: true,
      }
    });

    const test = session.reduce((acc, ses) => acc + differenceInMinutes(ses.endTime, ses.startTime), 0);
    return Result.ok(test);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const getCurrentStreak = async (): AsyncResult<number> => {
  try {
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
        take: SESSION_PAGINATION,
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
