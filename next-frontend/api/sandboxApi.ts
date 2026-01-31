import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { z } from "zod";

const BASE_URL = "/admin/sandbox";

export const sandboxLifecycleSchema = z.object({
  createdBy: z.string(),
  createdType: z.string(),
  endedAt: z.coerce.date().nullable(),
  sandboxLifecycleId: z.string().uuid(),
  startedAt: z.coerce.date(),
  status: z.string(),
  torndownBy: z.string().nullable(),
  torndownType: z.string().nullable(),
  uniqueUsers: z.number(),
});

export type SandboxLifecycle = z.infer<typeof sandboxLifecycleSchema>;

export const getLifecycles = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/lifecycles`);
  return await parseResponseUnsafe(data, z.array(sandboxLifecycleSchema));
};

export type SandboxResetResponse = {
  new: SandboxLifecycle;
  old: null | SandboxLifecycle;
};

const sandboxResetResponseSchema = z.object({
  new: sandboxLifecycleSchema,
  old: sandboxLifecycleSchema.nullable(),
});

export type ResetSandboxParams = {
  triggeredBy: string;
  triggeredType: string;
};

export const resetSandbox = async (params: ResetSandboxParams) => {
  const { data } = await baseApi.post(`${BASE_URL}/proxy-reset`, params);
  return await parseResponseUnsafe(data, sandboxResetResponseSchema);
};
