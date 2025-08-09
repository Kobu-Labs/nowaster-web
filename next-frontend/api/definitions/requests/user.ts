import { z } from "zod";

const create = z.object({
  id: z.string(),
  username: z.string().trim().min(1),
  avatarUrl: z.string().optional(),
});

const update = z.object({
  id: z.string(),
  username: z.string().trim().min(1).optional(),
  avatarUrl: z.string().optional(),
});

const updateVisibility = z.object({
  visible_to_friends: z.boolean(),
  visible_to_groups: z.boolean(),
  visible_to_public: z.boolean(),
});

const getProfile = z.object({
  id: z.string().optional(),
});

export type UserRequest = {
  [Property in keyof typeof UserRequestSchema]: z.infer<
    (typeof UserRequestSchema)[Property]
  >;
};

export const UserRequestSchema = {
  create,
  update,
  updateVisibility,
  getProfile,
} as const;
