"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  Heart,
  MessageCircle,
  Trophy,
  UserPlus,
  Megaphone,
  Rocket,
  AlertTriangle,
  Star,
  Shield,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  Notification,
  NotificationType,
  FriendRequestData,
  SessionReactionData,
  SessionCommentData,
  SystemReleaseData
} from "@/api/definitions/models/notification";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "friend:new_request":
    case "friend:request_accepted":
    case "friend:request_declined":
      return <UserPlus className="h-5 w-5 text-blue-500" />;

    case "session:reaction_added":
      return <Heart className="h-5 w-5 text-pink-500" />;

    case "session:comment_added":
      return <MessageCircle className="h-5 w-5 text-green-500" />;

    case "session:completed_milestone":
      return <Trophy className="h-5 w-5 text-yellow-500" />;

    case "group:invite_received":
    case "group:member_joined":
      return <Users className="h-5 w-5 text-purple-500" />;

    case "group:announcement":
      return <Megaphone className="h-5 w-5 text-orange-500" />;

    case "system:new_release":
      return <Rocket className="h-5 w-5 text-indigo-500" />;

    case "system:maintenance_alert":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;

    case "system:feature_announcement":
      return <Star className="h-5 w-5 text-cyan-500" />;

    case "system:security_notice":
      return <Shield className="h-5 w-5 text-red-600" />;

    default:
      return <Megaphone className="h-5 w-5 text-gray-500" />;
  }
}

function getNotificationTitle(notification: Notification): string {
  switch (notification.notification_type) {
    case "friend:new_request":
      return "New friend request";

    case "friend:request_accepted":
      return "Friend request accepted";

    case "friend:request_declined":
      return "Friend request declined";

    case "session:reaction_added":
      return "Session reaction";

    case "session:comment_added":
      return "Session comment";

    case "session:completed_milestone":
      return "Milestone achieved";

    case "group:invite_received":
      return "Group invitation";

    case "group:member_joined":
      return "New group member";

    case "group:announcement":
      return "Group announcement";

    case "system:new_release":
      return "New release available";

    case "system:maintenance_alert":
      return "Maintenance notice";

    case "system:feature_announcement":
      return "New feature";

    case "system:security_notice":
      return "Security notice";

    default:
      return "Notification";
  }
}

function getNotificationMessage(notification: Notification): string {
  switch (notification.notification_type) {
    case "friend:new_request": {
      const data = notification.data as FriendRequestData;
      return `${data.requester_username} wants to be your friend${data.message ? `: "${data.message}"` : ""}`;
    }

    case "friend:request_accepted": {
      const data = notification.data as any; // FriendRequestAcceptedData
      return `${data.accepter_username} accepted your friend request`;
    }

    case "friend:request_declined": {
      const data = notification.data as any; // FriendRequestDeclinedData
      return `${data.decliner_username} declined your friend request`;
    }

    case "session:reaction_added": {
      const data = notification.data as SessionReactionData;
      return `${data.reactor_username} reacted ${data.emoji} to your session${data.session_description ? `: "${data.session_description}"` : ""}`;
    }

    case "session:comment_added": {
      const data = notification.data as SessionCommentData;
      return `${data.commenter_username} commented on your session: "${data.comment_preview}"`;
    }

    case "session:completed_milestone": {
      const data = notification.data as any; // SessionMilestoneData
      return `${data.achievement_description}`;
    }

    case "group:invite_received": {
      const data = notification.data as any; // GroupInviteData
      return `${data.inviter_username} invited you to join "${data.group_name}"`;
    }

    case "group:member_joined": {
      const data = notification.data as any; // GroupMemberJoinedData
      return `${data.member_username} joined "${data.group_name}"`;
    }

    case "group:announcement": {
      const data = notification.data as any; // GroupAnnouncementData
      return `New announcement in "${data.group_name}": ${data.preview}`;
    }

    case "system:new_release": {
      const data = notification.data as SystemReleaseData;
      return `${data.title} (v${data.version}) - ${data.description}`;
    }

    case "system:maintenance_alert": {
      const data = notification.data as any; // SystemMaintenanceData
      return `${data.title}: ${data.description}`;
    }

    case "system:feature_announcement": {
      const data = notification.data as any; // SystemFeatureData
      return `${data.feature_name}: ${data.description}`;
    }

    case "system:security_notice": {
      const data = notification.data as any; // SystemSecurityData
      return `${data.title}: ${data.description}`;
    }

    default:
      return "You have a new notification";
  }
}

function getSourceName(notification: Notification): string {
  switch (notification.source_type) {
    case "user":
      return notification.source_data.username;
    case "group":
      return notification.source_data.name;
    case "system":
      return notification.source_data.system_name;
    default:
      return "Unknown";
  }
}

export function NotificationItem({
  notification,
  onClick,
  onDelete
}: NotificationItemProps) {
  const title = getNotificationTitle(notification);
  const message = getNotificationMessage(notification);
  const icon = getNotificationIcon(notification.notification_type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors group relative bg-pink-subtle",
        !notification.seen && "border-l-4 border-l-pink-400"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate text-white">
            {title}
          </p>
          <div className="flex items-center gap-2 ml-2">
            {!notification.seen && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
          {message}
        </p>

        <p className="text-xs mt-2">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
