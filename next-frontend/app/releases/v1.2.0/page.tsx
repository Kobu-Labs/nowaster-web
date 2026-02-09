import { ReleaseHeader } from "@/components/release/ReleaseHeader";
import { getReleaseComponent } from "@/lib/releaseRegistry";
import { getReleaseOrRedirect } from "@/lib/releases";

const RELEASE_VERSION = "v1.2.0";

export default async function ReleasePage() {
  const ReleaseComponent = getReleaseComponent(RELEASE_VERSION);
  const releaseData = await getReleaseOrRedirect(RELEASE_VERSION);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ReleaseHeader release={releaseData} />
      <ReleaseComponent />
    </div>
  );
}
