import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { getInitials } from "@/lib/utils";
import type { FC } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";

interface UserAvatarProps {
  avatar_url?: null | string;
  username: string;
}

export const UserAvatar: FC<UserAvatarProps> = (props) => {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">
        <Avatar className="h-6 w-6">
          <AvatarImage
            alt={props.username}
            src={props.avatar_url ?? undefined}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
            {getInitials(props.username)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <p>{props.username}</p>
      </TooltipContent>
    </Tooltip>
  );
};
