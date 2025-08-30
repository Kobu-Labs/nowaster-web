import {
  Notification,
  SessionReactionAddedData,
} from "@/api/definitions/models/notification";
import { Badge } from "@/components/shadcn/badge";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { UserAvatar } from "@/components/visualizers/user/UserAvatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { FC, useMemo } from "react";

type SessionReactionAddedNotificationItemProps = {
  notifications: {
    notification: Notification & {
      data: SessionReactionAddedData;
    };
  }[];
  sessionId: string;
};

type GroupedReaction = {
  emoji: string;
  users: Array<{
    id: string;
    username: string;
    avatar_url: string | null;
  }>;
  count: number;
};

export const SessionReactionAddedNotificationItem: FC<
  SessionReactionAddedNotificationItemProps
> = (props) => {
  const { sessionData, groupedReactions, allUsers } = useMemo(() => {
    const notifications = props.notifications;
    const sessionData = notifications[0]!.notification.data;

    // Group reactions by emoji
    const reactionMap = new Map<string, Set<string>>();
    const userMap = new Map<
      string,
      { id: string; username: string; avatar_url: string | null }
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
    const groupedReactions: GroupedReaction[] = Array.from(
      reactionMap.entries(),
    )
      .map(([emoji, userIds]) => ({
        emoji,
        users: Array.from(userIds).map((id) => userMap.get(id)!),
        count: userIds.size,
      }))
      .sort((a, b) => b.count - a.count);

    const allUsers = Array.from(userMap.values());

    return { sessionData, groupedReactions, allUsers };
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
      result += " and " + user2.username;
    }

    return result + " reacted to your session";
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
                key={user.id}
                className="relative"
                style={{
                  marginLeft: index > 0 ? "-8px" : "0",
                  zIndex: index,
                }}
              >
                <UserAvatar
                  username={user.username}
                  avatar_url={user.avatar_url}
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
                +{allUsers.length - 3}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {groupedReactions.map((reaction) => (
              <Badge
                variant="outline"
                key={reaction.emoji}
                className="flex items-center px-1 py-0 gap-1 rounded-full text-xs hover:bg-muted pointer-events-none"
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {latestNotification &&
            formatDistanceToNow(latestNotification.created_at, {
              addSuffix: true,
            })}
        </p>
      </div>
    </div>
  );
};
