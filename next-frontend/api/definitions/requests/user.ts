import { z } from "zod";

const create = z.object({
  avatarUrl: z.string().optional(),
  id: z.string(),
  username: z.string().trim().min(1),
});

const update = z.object({
  avatarUrl: z.string().optional(),
  id: z.string(),
  username: z.string().trim().min(1).optional(),
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
  getProfile,
  update,
  updateVisibility,
} as const;
