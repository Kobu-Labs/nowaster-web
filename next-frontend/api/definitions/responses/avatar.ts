import {
  ActivityEntrySchema,
  AvatarHistoryEntrySchema,
  AvatarPresetSchema,
  GenerationRunSchema,
  HintSchema,
  UserAvatarSchema,
} from "@/api/definitions/models/avatar";
import { z } from "zod";

const getAvatar = UserAvatarSchema.nullable();
const enable = UserAvatarSchema;
const disable = UserAvatarSchema;
const setPreset = UserAvatarSchema;
const listPresets = z.array(AvatarPresetSchema);
const triggerGeneration = GenerationRunSchema;
const listRuns = z.array(GenerationRunSchema);
const getLatestRun = GenerationRunSchema.nullable();
const listHistory = z.array(AvatarHistoryEntrySchema);
const searchHints = z.array(HintSchema);
const createHint = HintSchema;
const listCategoryHints = z.array(HintSchema);
const assignCategoryHint = z.null();
const removeCategoryHint = z.null();

// Admin
const adminListAllPresets = z.array(AvatarPresetSchema);
const adminBulkUploadPresets = z.array(AvatarPresetSchema);
const adminCreatePreset = AvatarPresetSchema;
const adminUpdatePreset = AvatarPresetSchema;
const adminDeletePreset = z.null();
const adminUploadPresetToLeonardo = AvatarPresetSchema;
const adminTriggerGeneration = GenerationRunSchema;
const adminGrantGenerations = UserAvatarSchema;
const adminGenerate = GenerationRunSchema;
const adminPlaygroundGenerate = GenerationRunSchema;
const adminListRecentRuns = z.array(GenerationRunSchema);
const adminGetPlaygroundData = z.array(ActivityEntrySchema);

export type AvatarResponse = {
  [Property in keyof typeof AvatarResponseSchema]: z.infer<
    (typeof AvatarResponseSchema)[Property]
  >;
};

export const AvatarResponseSchema = {
  adminBulkUploadPresets,
  adminCreatePreset,
  adminDeletePreset,
  adminGenerate,
  adminGetPlaygroundData,
  adminGrantGenerations,
  adminListAllPresets,
  adminListRecentRuns,
  adminPlaygroundGenerate,
  adminTriggerGeneration,
  adminUpdatePreset,
  adminUploadPresetToLeonardo,
  assignCategoryHint,
  createHint,
  disable,
  enable,
  getAvatar,
  getLatestRun,
  listCategoryHints,
  listHistory,
  listPresets,
  listRuns,
  removeCategoryHint,
  searchHints,
  setPreset,
  triggerGeneration,
} as const;
