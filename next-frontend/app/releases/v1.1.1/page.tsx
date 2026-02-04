// INFO: just a placeholder for first release note
export const dynamic = "force-static";

import { ReleaseHeader } from "@/components/release/ReleaseHeader";
import { getReleaseOrRedirect } from "@/lib/releases";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ version: string; }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;

  return {
    description: `Release notes for Nowaster ${version}`,
    title: `Release ${version} | Nowaster`,
  };
}

export default async function ReleasePage() {
  const release = await getReleaseOrRedirect("v1.1.1");

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ReleaseHeader release={release} />
    </div>
  );
}
