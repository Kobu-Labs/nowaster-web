"use client";

import { Card, CardContent } from "@/components/shadcn/card";
import { InviteLinkPanel } from "@/components/visualizers/communities/InviteLinkPanel";
import { InviteManagementList } from "@/components/visualizers/communities/InviteManagementList";
import { InviteMemberForm } from "@/components/visualizers/communities/InviteMemberForm";
import type { FC } from "react";

type InviteManagementPanelProps = {
  communityId: string;
};

export const InviteManagementPanel: FC<InviteManagementPanelProps> = ({ communityId }) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">Invite a member</h3>
          <InviteMemberForm communityId={communityId} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Invite link</h3>
          <InviteLinkPanel communityId={communityId} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Invites</h3>
          <InviteManagementList communityId={communityId} />
        </div>
      </CardContent>
    </Card>
  );
};
