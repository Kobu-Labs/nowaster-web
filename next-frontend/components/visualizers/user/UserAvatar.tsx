import { getInitials } from "@/lib/utils";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/shadcn/avatar";
import { FC } from "react";

type UserAvatarProps = {
  avatar_url?: string | null;
  username: string;
};

export const UserAvatar: FC<UserAvatarProps> = (props) => {
  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={props.avatar_url ?? undefined} alt={props.username} />
      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
        {getInitials(props.username)}
      </AvatarFallback>
    </Avatar>
  );
};
