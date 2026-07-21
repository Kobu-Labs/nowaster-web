import { z } from "zod";

export const AvatarTierSchema = z.enum(["free", "paid"]);
export const GenerationStatusSchema = z.enum([
  "pending",
  "running",
  "success",
  "failed",
]);

export const AvatarPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  thumbnailUrl: z.string(),
  referenceImageUrl: z.string(),
  isActive: z.boolean(),
  leonardoInitImageId: z.string().nullable().optional(),
  createdAt: z.coerce.date<Date>(),
});

export const UserAvatarSchema = z.object({
  userId: z.string(),
  tier: AvatarTierSchema,
  isEnabled: z.boolean(),
  currentImageUrl: z.string().nullable(),
  currentThumbUrl: z.string().nullable(),
  lastGeneratedAt: z.coerce.date<Date>().nullable(),
  nextGenerationAt: z.coerce.date<Date>().nullable(),
  basePresetId: z.string().uuid().nullable(),
  updatedAt: z.coerce.date<Date>(),
});

export const GenerationRunSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  status: GenerationStatusSchema,
  startedAt: z.coerce.date<Date>().nullable(),
  completedAt: z.coerce.date<Date>().nullable(),
  imageUrl: z.string().nullable(),
  thumbUrl: z.string().nullable(),
  inputData: z.string().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number(),
  createdAt: z.coerce.date<Date>(),
});

export const AvatarHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  imageUrl: z.string(),
  thumbUrl: z.string(),
  generationRunId: z.string().uuid().nullable(),
  generatedAt: z.coerce.date<Date>(),
});

export const HintSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  usageCount: z.number(),
});

export const ActivityEntrySchema = z.object({
  label: z.string(),
  hours: z.number(),
});

export type AvatarTier = z.infer<typeof AvatarTierSchema>;
export type GenerationStatus = z.infer<typeof GenerationStatusSchema>;
export type AvatarPreset = z.infer<typeof AvatarPresetSchema>;
export type UserAvatar = z.infer<typeof UserAvatarSchema>;
export type GenerationRun = z.infer<typeof GenerationRunSchema>;
export type AvatarHistoryEntry = z.infer<typeof AvatarHistoryEntrySchema>;
export type Hint = z.infer<typeof HintSchema>;
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
