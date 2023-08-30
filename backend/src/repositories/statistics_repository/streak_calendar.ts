import { Result } from "@badrap/result";
import type { AsyncResult } from "../types";
import client from "../client";
import { subDays } from "date-fns";


const DAYS_AMOUNT = 365;

export const getStreakCalendarData = async (): AsyncResult<Date[]> => {
  try {
    const result = await client.scheduledEntity.findMany({
      where: {
        endTime: {
          lt: new Date(),
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
