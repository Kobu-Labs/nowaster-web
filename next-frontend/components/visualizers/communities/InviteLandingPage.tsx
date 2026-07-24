"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useJoinPreview } from "@/components/hooks/community/useJoinPreview";
import { useJoinViaCode } from "@/components/hooks/community/useJoinViaCode";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FC } from "react";

type InviteLandingPageProps = {
  code: string;
};

export const InviteLandingPage: FC<InviteLandingPageProps> = ({ code }) => {
  const query = useJoinPreview(code);
  const joinViaCode = useJoinViaCode();
  const router = useRouter();

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-md p-6 space-y-4 text-center">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="mx-auto h-10 w-32" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">
          This invite link isn&apos;t valid
        </h1>
        <p className="text-muted-foreground">
          This invite link is no longer valid. Ask the community owner for a
          new one.
        </p>
        <Button asChild variant="outline">
          <Link href="/home/communities">Back to Communities</Link>
        </Button>
      </div>
    );
  }

  const preview = query.data;

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <Avatar className="mx-auto h-16 w-16">
            <AvatarImage
              alt={preview.name}
              src={preview.avatar_url ?? undefined}
            />
            <AvatarFallback className="text-xl">
              {getInitials(preview.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold">{preview.name}</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-1">
            <Users className="h-4 w-4" />
            {preview.member_count}
            {" "}
            members
          </p>
          <Button
            disabled={joinViaCode.isPending}
            loading={joinViaCode.isPending}
            onClick={() => {
              joinViaCode.mutate(code, {
                onSuccess: () => {
                  router.push(`/home/communities/${preview.community_id}`);
                },
              });
            }}
          >
            Join Community
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
