"use client";

import type { FC } from "react";
import { useState } from "react";
import { Plus, Smile } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";
import type { ReadFeedEvent, ReadFeedReaction } from "@/api/definitions/models/feed";
import {
  useAddReaction,
  useRemoveReaction,
} from "@/components/hooks/feed/useFeed";
import { useAuth } from "@/app/auth-context";

interface ReactionBarProps {
  event: ReadFeedEvent;
  reactions: ReadFeedReaction[];
  userReaction?: null | string;
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

export const ReactionBar: FC<ReactionBarProps> = ({ event, reactions }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const addReaction = useAddReaction();
  const { user } = useAuth();
  const removeReaction = useRemoveReaction();

  if (!user) {
    return;
  }

  const sortedGroupedReactions = Object.entries(
    reactions.reduce<Record<string, { count: number; currentUserReacted: boolean; }>>(
      (acc, reaction) => {
        acc[reaction.emoji] = {
          count: (acc[reaction.emoji]?.count ?? 0) + 1,
          currentUserReacted:
            acc[reaction.emoji]?.currentUserReacted
            ?? reaction.user.id === user.id,
        };
        return acc;
      },
      {},
    ),
  ).sort(([emojiA, a], [emojiB, b]) => {
    if (a.count === b.count) {
      return emojiA.localeCompare(emojiB);
    }
    return b.count - a.count;
  });

  const totalReactions = sortedGroupedReactions.reduce(
    (sum, [, reaction]) => sum + reaction.count,
    0,
  );

  const handleEmojiClick = (emoji: string) => {
    const emojiData = sortedGroupedReactions.find(([e]) => e === emoji)?.[1];
    if (emojiData?.currentUserReacted) {
      removeReaction.mutate({
        emoji,
        feed_event_id: event.id,
      });
    } else {
      addReaction.mutate({
        emoji,
        feed_event_id: event.id,
      });
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <div className="flex gap-1 flex-wrap">
        {sortedGroupedReactions.map(
          ([emoji, { count, currentUserReacted }]) => (
            <Button
              className={cn(
                "h-8 px-2 text-xs rounded-full border",
                currentUserReacted
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "hover:bg-muted",
              )}
              key={emoji}
              onClick={() => { handleEmojiClick(emoji); }}
              size="sm"
              variant="ghost"
            >
              <span className="mr-1">{emoji}</span>
              <span>{count}</span>
            </Button>
          ),
        )}
      </div>

      <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            {totalReactions > 0
              ? (
                  <Plus className="h-4 w-4" />
                )
              : (
                  <Smile className="h-4 w-4" />
                )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="grid grid-cols-5 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                className="h-8 w-8 p-0 text-lg hover:bg-muted rounded"
                key={emoji}
                onClick={() => { handleEmojiClick(emoji); }}
                size="sm"
                variant="ghost"
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
