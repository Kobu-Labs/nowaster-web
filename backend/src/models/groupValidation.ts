import { z } from "zod";

export const createGroupSchema = z.object({
  creatorId: z.string().uuid(),
  groupName: z.string(),
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

