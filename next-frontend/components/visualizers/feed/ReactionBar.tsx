"use client";

import { FC, useState } from "react";
import { Plus, Smile } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";
import { ReadFeedEvent, ReadFeedReaction } from "@/api/definitions/models/feed";
import {
  useAddReaction,
  useRemoveReaction,
} from "@/components/hooks/feed/useFeed";
import { useAuth } from "@clerk/nextjs";

interface ReactionBarProps {
  event: ReadFeedEvent;
  reactions: ReadFeedReaction[];
  userReaction?: string | null;
}

const COMMON_EMOJIS = [
  "👏",
  "🔥",
  "💪",
  "👍",
  "❤️",
  "😊",
  "🎉",
  "⭐",
  "💯",
  "🚀",
];

export const ReactionBar: FC<ReactionBarProps> = ({
  event,
  reactions,
  userReaction,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const addReaction = useAddReaction();
  const { userId } = useAuth();
  const removeReaction = useRemoveReaction();

  if (!userId) {
    return;
  }

  // Group reactions by emoji and count them
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = {
        count: (acc[reaction.emoji]?.count ?? 0) + 1,
        currentUserReacted:
          acc[reaction.emoji]?.currentUserReacted ||
          reaction.user.id === userId,
      };
      return acc;
    },
    {} as Record<string, { count: number; currentUserReacted: boolean }>,
  );

  const totalReactions = Object.values(reactionCounts).reduce(
    (sum, reaction) => sum + reaction.count,
    0,
  );

  const handleEmojiClick = (emoji: string) => {
    if (userReaction === emoji) {
      // Remove reaction if user already reacted with this emoji
      removeReaction.mutate({
        feed_event_id: event.id,
        emoji: emoji,
      });
    } else {
      // Add new reaction
      addReaction.mutate({
        feed_event_id: event.id,
        emoji: emoji,
      });
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      {/* Existing reactions */}
      <div className="flex gap-1 flex-wrap">
        {Object.entries(reactionCounts).map(
          ([emoji, { count, currentUserReacted }]) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-xs rounded-full border",
                currentUserReacted
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "hover:bg-muted",
              )}
              onClick={() => handleEmojiClick(emoji)}
            >
              <span className="mr-1">{emoji}</span>
              <span>{count}</span>
            </Button>
          ),
        )}
      </div>

      {/* Add reaction button */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
          >
            {totalReactions > 0 ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Smile className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-5 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-muted rounded"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {totalReactions === 0 && (
        <span className="text-xs text-muted-foreground ml-2">
          Be the first to react
        </span>
      )}
    </div>
  );
};
