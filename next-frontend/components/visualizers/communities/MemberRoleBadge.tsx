import type { CommunityMemberRole } from "@/api/definitions";
import { Badge } from "@/components/shadcn/badge";
import { Crown, Shield } from "lucide-react";
import type { FC } from "react";

type MemberRoleBadgeProps = {
  role: CommunityMemberRole;
};

const ROLE_LABEL: Record<CommunityMemberRole, string> = {
  manager: "Manager",
  member: "Member",
  owner: "Owner",
};

export const MemberRoleBadge: FC<MemberRoleBadgeProps> = ({ role }) => {
  return (
    <Badge className="gap-1" variant={role === "member" ? "outline" : "secondary"}>
      {role === "owner" && <Crown className="h-3 w-3" />}
      {role === "manager" && <Shield className="h-3 w-3" />}
      {ROLE_LABEL[role]}
    </Badge>
  );
};
