import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { z } from "zod";

const BASE_URL = "/admin";

export const dbBackupSchema = z.object({
  backupFile: z.string(),
  backupSizeGb: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  errorMessage: z.string().nullable(),
  finishedAt: z.coerce.date().nullable(),
  id: z.number(),
  startedAt: z.coerce.date().nullable(),
  status: z.string(),
  triggerBy: z.string(),
  triggerType: z.string(),
});

export type DbBackup = z.infer<typeof dbBackupSchema>;

export const getBackups = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/backups`);
  return await parseResponseUnsafe(data, z.array(dbBackupSchema));
};
