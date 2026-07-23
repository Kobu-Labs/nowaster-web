"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useInviteCode } from "@/components/hooks/community/useInviteCode";
import { useRegenerateInviteCode } from "@/components/hooks/community/useRegenerateInviteCode";
import { useToast } from "@/components/shadcn/use-toast";
import { Check, Copy, RotateCw } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type InviteCodeCardProps = {
  communityId: string;
};

export const InviteCodeCard: FC<InviteCodeCardProps> = ({ communityId }) => {
  const query = useInviteCode(communityId, true);
  const regenerate = useRegenerateInviteCode();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (query.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load invite code:
        {" "}
        {query.error.message}
      </p>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(query.data.code);
    setCopied(true);
    toast({ description: "Invite code copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Share this code so people can join your invite-only community.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input className="font-mono" readOnly value={query.data.code} />
          <div className="flex gap-2">
            <Button
              aria-label="Copy invite code"
              onClick={handleCopy}
              size="icon"
              variant="outline"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <RotateCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anyone with the old code will no longer be able to join.
                    Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => regenerate.mutate({ communityId })}
                  >
                    Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div aria-live="polite" className="sr-only">
          {copied && "Invite code copied to clipboard"}
        </div>
      </CardContent>
    </Card>
  );
};
