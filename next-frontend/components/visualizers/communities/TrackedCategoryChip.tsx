"use client";

import type { TrackedCategory } from "@/api/definitions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { useDeleteTrackedCategory } from "@/components/hooks/community/useDeleteTrackedCategory";
import { useUpdateTrackedCategory } from "@/components/hooks/community/useUpdateTrackedCategory";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { Check, Pencil, X } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type TrackedCategoryChipProps = {
  communityId: string;
  editable: boolean;
  trackedCategory: TrackedCategory;
};

export const TrackedCategoryChip: FC<TrackedCategoryChipProps> = ({
  communityId,
  editable,
  trackedCategory,
}) => {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(trackedCategory.name);
  const [color, setColor] = useState(trackedCategory.color);

  const updateTrackedCategory = useUpdateTrackedCategory();
  const deleteTrackedCategory = useDeleteTrackedCategory();

  const handleSave = () => {
    updateTrackedCategory.mutate(
      { communityId, id: trackedCategory.id, name, color },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-full border px-2 py-1">
        <ColorPicker initialColor={color} onSelect={setColor} />
        <Input
          className="h-7 w-32"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <button
          aria-label={`Save ${trackedCategory.name}`}
          className="text-muted-foreground hover:text-foreground"
          onClick={handleSave}
          type="button"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          aria-label="Cancel editing"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setEditing(false);
            setName(trackedCategory.name);
            setColor(trackedCategory.color);
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <Badge
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        variant="outline"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: trackedCategory.color }}
        />
        <span>{trackedCategory.name}</span>
        {editable && (
          <>
            <button
              aria-label={`Edit ${trackedCategory.name} tracked category`}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
              type="button"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              aria-label={`Remove ${trackedCategory.name} tracked category`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </Badge>

      <AlertDialog onOpenChange={setConfirmingDelete} open={confirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove &quot;
              {trackedCategory.name}
              &quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {trackedCategory.mapped_member_count > 0
                ? `This will remove ${trackedCategory.mapped_member_count} member${
                  trackedCategory.mapped_member_count === 1 ? "" : "s"
                }' mappings to this category too.`
                : "No members have mapped a category to this yet."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteTrackedCategory.mutate({
                  communityId,
                  id: trackedCategory.id,
                });
                setConfirmingDelete(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
