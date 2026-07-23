"use client";

import type { CommunityWithId } from "@/api/definitions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent } from "@/components/shadcn/card";
import { getInitials } from "@/lib/utils";
import { Globe, Lock } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

type CommunityCardProps = {
  community: CommunityWithId;
};

export const CommunityCard: FC<CommunityCardProps> = ({ community }) => {
  return (
    <Link href={`/home/communities/${community.id}`}>
      <Card className="group backdrop-blur-md bg-gray-900/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-lg cursor-pointer h-full flex flex-col">
        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-4">
            <Avatar>
              <AvatarImage
                alt={community.name}
                src={community.avatar_url ?? undefined}
              />
              <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {community.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {community.is_owner && (
                  <Badge className="w-fit" variant="secondary">
                    Owner
                  </Badge>
                )}
                <Badge className="w-fit flex items-center gap-1" variant="outline">
                  {community.visibility_type === "public"
                    ? (
                        <>
                          <Globe className="h-3 w-3" />
                          Public
                        </>
                      )
                    : (
                        <>
                          <Lock className="h-3 w-3" />
                          Invite only
                        </>
                      )}
                </Badge>
              </div>
            </div>
          </div>

          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {community.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
