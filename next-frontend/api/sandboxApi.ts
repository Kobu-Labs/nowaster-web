import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { z } from "zod";

const BASE_URL = "/admin/sandbox";

export const sandboxLifecycleSchema = z.object({
  createdBy: z.string(),
  createdByAvatarUrl: z.string().nullable().optional(),
  createdByDisplayName: z.string().nullable().optional(),
  createdType: z.string(),
  endedAt: z.coerce.date().nullable(),
  sandboxLifecycleId: z.string().uuid(),
  startedAt: z.coerce.date(),
  status: z.string(),
  torndownBy: z.string().nullable(),
  torndownByAvatarUrl: z.string().nullable().optional(),
  torndownByDisplayName: z.string().nullable().optional(),
  torndownType: z.string().nullable(),
  uniqueUsers: z.number(),
});

export type SandboxLifecycle = z.infer<typeof sandboxLifecycleSchema>;

export const getLifecycles = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/proxy-lifecycles`);
  return await parseResponseUnsafe(data, z.array(sandboxLifecycleSchema));
};

export type ResetSandboxParams = {
  triggeredBy: string;
  triggeredType: string;
};

export const resetSandbox = async (params: ResetSandboxParams) => {
  await baseApi.post(`${BASE_URL}/proxy-reset`, params);
};
