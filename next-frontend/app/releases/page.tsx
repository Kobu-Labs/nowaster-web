import type { Metadata } from "next";
import { env } from "@/env";
import { parseResponseUnsafe } from "@/api/baseApi";
import { ReleaseResponseSchema } from "@/api/definitions/responses/release";
import { ReleasesList } from "@/components/release/ReleaseList";

export const dynamic = "force-static";

export const metadata: Metadata = {
  description:
    "View all product releases and updates for Nowaster time tracking app",
  keywords: "releases, updates, changelog, new features, nowaster",
  title: "Release Notes | Nowaster",
};

export default async function ReleasesPage() {
  const releases = await fetchReleases();

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Release Notes
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Stay up to date with the latest features, improvements, and bug fixes.
        </p>
      </div>

      <ReleasesList releases={releases} />
    </div>
  );
}

async function fetchReleases() {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/releases`);
  const json: unknown = await response.json();

  return await parseResponseUnsafe(
    json,
    ReleaseResponseSchema.listPublicReleases,
  );
}
