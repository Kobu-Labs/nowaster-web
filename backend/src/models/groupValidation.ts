import { z } from "zod";

export const createGroupSchema = z.object({
  creatorId: z.string().uuid(),
  groupName: z.string().min(3).max(20),
  inviteOnly: z.boolean()
});

export const readGroupSchema = z.object({
  id: z.string().uuid(),
});

export const joinGroupSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
  code: z.string().optional(),
});

export const deleteGroupSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
});

export const generateInviteCodeSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const getGroupsByUser = z.object({
  userId: z.string().uuid(),
});

export const getUserDetailsPerGroup = z.object({
  groupId: z.string().uuid(),
});

export const getUsersOfGroupParams = z.object({
  groupId: z.string().uuid(),
});

export const kickUserSchema = z.object({
  groupId: z.string().uuid(),
  kickedUserId: z.string().uuid(),
  kickingUserId: z.string().uuid(),
});
