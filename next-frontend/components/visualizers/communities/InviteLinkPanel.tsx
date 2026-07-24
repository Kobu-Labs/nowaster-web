"use client";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useCreateLinkInvite } from "@/components/hooks/community/useCreateLinkInvite";
import { useToast } from "@/components/shadcn/use-toast";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type InviteLinkPanelProps = {
  communityId: string;
};

const EXPIRY_OPTIONS = [
  { label: "1 day", value: "1" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "Never", value: "never" },
];

export const InviteLinkPanel: FC<InviteLinkPanelProps> = ({ communityId }) => {
  const { toast } = useToast();
  const [expiry, setExpiry] = useState("7");
  const [copied, setCopied] = useState(false);
  const createLinkInvite = useCreateLinkInvite(communityId);

  const handleCreate = () => {
    createLinkInvite.mutate({
      expiresInDays: expiry === "never" ? null : (Number(expiry) as 1 | 30 | 7),
      maxUses: null,
    });
  };

  const handleCopy = async (code: string) => {
    const url = `${globalThis.location.origin}/home/communities/join/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ description: "Link copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select onValueChange={setExpiry} value={expiry}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="h-9"
          loading={createLinkInvite.isPending}
          onClick={handleCreate}
          size="sm"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Create invite link
        </Button>
      </div>

      {createLinkInvite.data?.code && (
        <div className="flex gap-2">
          <Input
            className="font-mono"
            readOnly
            value={`${globalThis.window === undefined ? "" : globalThis.location.origin}/home/communities/join/${createLinkInvite.data.code}`}
          />
          <Button
            aria-label="Copy invite link"
            onClick={() => void handleCopy(createLinkInvite.data.code!)}
            size="icon"
            variant="outline"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
      <div aria-live="polite" className="sr-only">
        {copied && "Link copied to clipboard"}
      </div>
    </div>
  );
};
