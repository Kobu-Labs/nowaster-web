import { parseResponseUnsafe } from "@/api/baseApi";
import {
  GetReleaseByVersionResponse,
  ReleaseResponseSchema,
} from "@/api/definitions/responses/release";
import { env } from "@/env";
import { redirect } from "next/navigation";

export async function getReleaseOrRedirect(
  version: string,
): Promise<GetReleaseByVersionResponse> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/releases/${version}`,
    );
    const json: unknown = await response.json();

    const data = await parseResponseUnsafe(
      json,
      ReleaseResponseSchema.getReleaseByVersion,
    );
    return data;
  } catch {
    redirect("/releases");
  }
}
