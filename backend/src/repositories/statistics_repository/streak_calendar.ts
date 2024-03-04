import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import { Result } from "@badrap/result";
import { subDays } from "date-fns";


const DAYS_AMOUNT = 365;

export const getStreakCalendarData = async (): AsyncResult<Date[]> => {
  try {
    const result = await client.scheduledEntity.findMany({
      where: {
        endTime: {
          lte: new Date(),
          gt: subDays(new Date(), DAYS_AMOUNT),
        }
      },
      select: {
        endTime: true
      }
    });

    return Result.ok(result.map(session => session.endTime));
  } catch (error) {
    return Result.err(error as Error);
  }
};
