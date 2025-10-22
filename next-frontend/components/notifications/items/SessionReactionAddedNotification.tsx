import type {
  Notification,
  SessionReactionAddedData,
} from "@/api/definitions/models/notification";
import { Badge } from "@/components/shadcn/badge";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import type { FC } from "react";
import { useMemo } from "react";

type GroupedReaction = {
  count: number;
  emoji: string;
  users: {
    avatar_url: null | string;
    id: string;
    username: string;
  }[];
};

type SessionReactionAddedNotificationItemProps = {
  notifications: {
    notification: {
      data: SessionReactionAddedData;
    } & Notification;
  }[];
  sessionId: string;
};

export const SessionReactionAddedNotificationItem: FC<
  SessionReactionAddedNotificationItemProps
> = (props) => {
  const { allUsers, groupedReactions, sessionData } = useMemo(() => {
    const { notifications } = props;
    const sessionData = notifications[0]!.notification.data;

    // Group reactions by emoji
    const reactionMap = new Map<string, Set<string>>();
    const userMap = new Map<
      string,
      { avatar_url: null | string; id: string; username: string; }
    >();

    notifications.forEach(({ notification }) => {
      const { emoji, user } = notification.data;
      userMap.set(user.id, user);

      if (!reactionMap.has(emoji)) {
        reactionMap.set(emoji, new Set());
      }
      reactionMap.get(emoji)!.add(user.id);
    });

    // Convert to grouped reactions and sort by count
    const groupedReactions: GroupedReaction[] = [...reactionMap.entries()]
      .map(([emoji, userIds]) => ({
        count: userIds.size,
        emoji,
        users: [...userIds].map((id) => userMap.get(id)!),
      }))
      .sort((a, b) => b.count - a.count);

    const allUsers = [...userMap.values()];

    return { allUsers, groupedReactions, sessionData };
  }, [props.notifications]);

  const latestNotification = props.notifications[0]?.notification;

  const getDescription = () => {
    const user1 = allUsers.at(0);
    const user2 = allUsers.at(1);
    if (allUsers.length > 2) {
      return `${user1?.username}, ${user2?.username} and ${allUsers.length - 2} other(s) reacted to your session`;
    }
    let result = "";
    if (user1 !== undefined) {
      result += user1.username;
    }
    if (user2) {
      result += ` and ${user2.username}`;
    }

    return `${result} reacted to your session`;
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 transition-colors group relative bg-blue-subtle",
        "border-l-4 border-l-blue-400",
      )}
    >
      <div className="shrink-0 mt-1">
        <Heart className="h-5 w-5 text-pink-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate text-white">
            Session reactions
          </span>
          <span className="text-accent/70">
            <CategoryBadge
              color={sessionData.session_category.color}
              name={sessionData.session_category.name}
            />
          </span>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          {getDescription()}
        </div>

        <div className="flex flex-wrap gap-4 mb-2 items-center">
          <div className="relative flex">
            {allUsers.slice(0, 3).map((user, index) => (
              <div
                className="relative"
                key={user.id}
                style={{
                  marginLeft: index > 0 ? "-8px" : "0",
                  zIndex: index,
                }}
              >
                <UserAvatar
                  avatar_url={user.avatar_url}
                  username={user.username}
                />
              </div>
            ))}
            {allUsers.length > 3 && (
              <div
                className="relative flex items-center justify-center w-6 h-6 bg-pink-500 border-2 rounded-full text-xs font-medium text-white"
                style={{
                  marginLeft: "-8px",
                  zIndex: allUsers.length,
                }}
              >
                +
                {allUsers.length - 3}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {groupedReactions.map((reaction) => (
              <Badge
                className="flex items-center px-1 py-0 gap-1 rounded-full text-xs hover:bg-muted pointer-events-none"
                key={reaction.emoji}
                variant="outline"
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {latestNotification
            && formatDistanceToNow(latestNotification.created_at, {
              addSuffix: true,
            })}
        </p>
      </div>
    </div>
  );
};
