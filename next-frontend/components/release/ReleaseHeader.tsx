"use client";

import { GetReleaseByVersionResponse } from "@/api/definitions/responses/release";
import { Badge } from "@/components/shadcn/badge";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { Calendar, Tag } from "lucide-react";
import type { FC } from "react";

type Props = {
  release: GetReleaseByVersionResponse;
};

export const ReleaseHeader: FC<Props> = ({ release }) => {
  return (
    <div>
      <div className="mb-8 pb-8 border-b">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">{release.name}</h1>
          <Badge className="text-lg px-3 py-1" variant="secondary">
            {release.version}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {release.released_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Released on
                {" "}
                {new Date(release.released_at).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {release.released_by && (
            <div className="flex items-center gap-1">
              <UserAvatar
                avatar_url={release.released_by.avatar_url}
                username={release.released_by.username}
              />
              <span>{release.released_by.username}</span>
            </div>
          )}
        </div>

        {release.tags && release.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {release.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
