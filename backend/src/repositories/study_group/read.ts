import type { AsyncResult } from "../types";
import type { Group, ScheduledEntity, User } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadGroupParams = {
    id: string
}

const byId = async (params: ReadGroupParams): AsyncResult<Group> => {
  try {
    const group = await client.group.findFirst({
      where: {
        id: params.id,
      }
    });

    if (!group) {
      return Result.err(new Error("Group does not exist"));
    }

    return Result.ok(group);

  } catch (error) {
    return Result.err(error as Error);
  }
};
type ReadGroupsByUserParams = {
    userId: string
}

const byUser = async (params: ReadGroupsByUserParams): AsyncResult<Group[]> => {
  try {
    const groups = await client.group.findMany({
      where: {
        users: {
          some: {
            userId: params.userId
          }
        }

      },
    });
    return Result.ok(groups);
  } catch (error) {
    return Result.err(error as Error);
  }
};

type GetGroupSummary = {
    groupId: string
}
type GetUsersOfGroup = {
    groupId: string
}

const usersOfGroup = async (params: GetUsersOfGroup): AsyncResult<User[]> => {
  try {
    const data = await client.user.findMany({
      where: {
        groups: {
          some: {
            groupId: params.groupId
          }
        }
      }

    });
    return Result.ok(data);

  } catch (error) {
    return Result.err(error as Error);
  }
};

const groupSummary = async (params: GetGroupSummary) => {
  try {
    const users = await usersOfGroup(params);
    if (users.isErr) {
      return Result.err(users.error);
    }
    const userIds = users.value.map(x => x.id);

    const data = await client.scheduledEntity.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      include: {
        user: true
      }
    });

    const processed = groupEntities(data);

    return Result.ok(processed);



  } catch (error) {
    return Result.err(error as Error);
  }
};

type SummaryReport = {
    user: User,
    hours: number
}


const calculateTime = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / 1000 / 60 / 60);
};
const groupEntities = (data: (ScheduledEntity & { user: User })[]): SummaryReport[] => {
  const result: Record<string, SummaryReport> = {};
  data.forEach((value) => {
    if (value.userId in result) {
      //@ts-ignore
      result[value.userId].hours += calculateTime(value.startTime, value.endTime);
    } else {
      result[value.userId] = { hours: calculateTime(value.startTime, value.endTime), user: value.user };
    }
  });

  return Object.values(result);
};

const getPrivateGroups = async (): AsyncResult<Group[]> => {
  try {
    const groups = await client.group.findMany({
      where: {
        inviteOnly: true,
      },
    });
    return Result.ok(groups);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const getAllGroups = async (): AsyncResult<Group[]> => {
  try {
    const groups = await client.group.findMany();
    return Result.ok(groups);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const getPublicGroups = async (): AsyncResult<Group[]> => {
  try {
    const groups = await client.group.findMany({
      where: {
        inviteOnly: false,
      },
    });
    return Result.ok(groups);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const read = {
  byId,
  byUser,
  usersOfGroup,
  groupSummary,
  getPublicGroups,
  getPrivateGroups,
  getAllGroups,
};

export default read;
