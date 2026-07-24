import { z } from "zod";

import { ActivityEntrySchema } from "@/api/definitions/models/avatar";

const setPreset = z.object({
  presetId: z.string().uuid(),
});

const searchHints = z.object({
  q: z.string().default(""),
});

const createHint = z.object({
  label: z.string().min(1),
});

const assignCategoryHint = z.object({
  categoryId: z.string().uuid(),
  hintId: z.string().uuid(),
});

const removeCategoryHint = z.object({
  categoryId: z.string().uuid(),
  hintId: z.string().uuid(),
});

const listCategoryHints = z.object({
  categoryId: z.string().uuid(),
});

const adminCreatePreset = z.object({
  name: z.string().min(1),
  thumbnailUrl: z.string().url(),
  referenceImageUrl: z.string().url(),
  isActive: z.boolean().optional(),
});

const adminUpdatePreset = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().optional(),
  referenceImageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const adminDeletePreset = z.object({
  id: z.string().uuid(),
});

const adminUploadPresetToLeonardo = z.object({
  id: z.string().uuid(),
});

const adminTriggerGeneration = z.object({
  userId: z.string(),
});

const adminGrantGenerations = z.object({
  userId: z.string(),
  amount: z.number().int(),
});

const adminGenerateFromUser = z.object({
  type: z.literal("user"),
  userId: z.string(),
  assignToUserId: z.string().optional(),
});

const adminGenerateManual = z.object({
  type: z.literal("manual"),
  data: z.array(ActivityEntrySchema).min(1),
  assignToUserId: z.string(),
});

export type AvatarRequest = {
  [Property in keyof typeof AvatarRequestSchema]: z.infer<
    (typeof AvatarRequestSchema)[Property]
  >;
};

export const AvatarRequestSchema = {
  adminCreatePreset,
  adminDeletePreset,
  adminGenerateFromUser,
  adminGenerateManual,
  adminGrantGenerations,
  adminTriggerGeneration,
  adminUpdatePreset,
  adminUploadPresetToLeonardo,
  assignCategoryHint,
  createHint,
  listCategoryHints,
  removeCategoryHint,
  searchHints,
  setPreset,
} as const;
