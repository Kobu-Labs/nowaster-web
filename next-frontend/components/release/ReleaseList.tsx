import type { ListPublicReleasesResponse } from "@/api/definitions/responses/release";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import type { FC } from "react";

type ReleasesListProps = {
  releases: ListPublicReleasesResponse;
};

export const ReleasesList: FC<ReleasesListProps> = ({ releases }) => {
  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No releases available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
      {releases.map((release) => (
        <ReleaseCard key={release.version} release={release} />
      ))}
    </div>
  );
};
