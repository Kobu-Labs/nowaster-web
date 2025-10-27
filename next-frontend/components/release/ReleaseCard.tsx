import { ListPublicReleasesResponse } from "@/api/definitions/responses/release";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/shadcn/card";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { Link, Calendar, Tag } from "lucide-react";
import { FC } from "react";

type ReleaseCardProps = {
  release: ListPublicReleasesResponse[number];
};

export const ReleaseCard: FC<ReleaseCardProps> = ({ release }) => {
  return (
    <Link href={`/releases/${release.version}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer group">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl group-hover:text-primary transition-colors">
              {release.name}
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {release.version}
            </Badge>
          </div>

          {release.released_at && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <CardDescription className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(release.released_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>

              {release.released_by && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <UserAvatar
                    username={release.released_by.username}
                    avatar_url={release.released_by.avatar_url}
                  />
                  <span className="text-sm">
                    {release.released_by.username}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        {release.short_description && (
          <CardContent>
            <p className="text-muted-foreground line-clamp-3 leading-relaxed">
              {release.short_description}
            </p>
          </CardContent>
        )}

        {release.tags && release.tags.length > 0 && (
          <CardFooter>
            <div className="flex flex-wrap gap-2">
              {release.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};
