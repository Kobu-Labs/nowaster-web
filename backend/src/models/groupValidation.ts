import { z } from "zod";

export const createGroupSchema = z.object({
  creatorId: z.string().uuid(),
  groupName: z.string(),
});

export const readGroupSchema = z.object({
  id: z.string().uuid(),
});

export const updateGroupSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const deleteGroupSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
});
