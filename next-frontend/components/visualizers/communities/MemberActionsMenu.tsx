import type { CommunityCapabilities, CommunityMember } from "@/api/definitions";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { MoreHorizontal, ShieldMinus, ShieldPlus, UserMinus } from "lucide-react";
import type { FC } from "react";

type MemberActionsMenuProps = {
  capabilities: CommunityCapabilities | undefined;
  member: CommunityMember;
  onDemote: () => void;
  onPromote: () => void;
  onRequestRemove: () => void;
};

export const MemberActionsMenu: FC<MemberActionsMenuProps> = ({
  member,
  capabilities,
  onPromote,
  onDemote,
  onRequestRemove,
}) => {
  if (member.role === "owner" || !capabilities) {
    return null;
  }

  const canRemove
    = member.role === "manager"
      ? capabilities.can_change_roles
      : capabilities.can_manage_members;

  if (!capabilities.can_change_roles && !canRemove) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Member actions for ${member.user.username}`}
          size="icon"
          variant="ghost"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {capabilities.can_change_roles && member.role === "member" && (
          <DropdownMenuItem onClick={onPromote}>
            <ShieldPlus className="mr-2 h-4 w-4" />
            Promote to Manager
          </DropdownMenuItem>
        )}
        {capabilities.can_change_roles && member.role === "manager" && (
          <DropdownMenuItem onClick={onDemote}>
            <ShieldMinus className="mr-2 h-4 w-4" />
            Demote to Member
          </DropdownMenuItem>
        )}
        {canRemove && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onRequestRemove}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remove from community
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
